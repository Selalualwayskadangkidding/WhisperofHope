import { useEffect, useRef, useState } from "react";
import DebugCollisionOverlay from "../mechanics/DebugCollisionOverlay.jsx";
import { moveWithCollisionAxis } from "../mechanics/collision.js";
import {
  STORAGE_KEY,
  getDefaultObstacles,
  loadObstaclesFromStorage,
} from "../data/yardObstacles.js";
import { overlaps } from "../mechanics/doors.js"; // pakai overlaps saja
import useDoorEnter from "../mechanics/useDoorEnter.js";
import DoorHint from "../components/DoorHint.jsx";

/** ==== KONFIG MAP / COLLISION ==== */
const COLLISION_ENABLED = true;
const SHOW_COLLISION_VISUAL = false;
const HOUSE_RECT_ID_FOR_DOOR = 7; // obstacle rumah kamu
const SHOW_DOOR_DEBUG_BOX = false; // NYALAIN dulu buat cek
const SHOW_HINT_DEBUG_TEXT = false; // teks kecil sudut untuk lihat state

/** ==== PLAYER HITBOX ==== */
const HITBOX = { offsetX: 65, offsetY: 135, w: 20, h: 15 };
const SPEED = 180; // px/detik

export default function YardScene({ onEnterHouse }) {
  // ==== UI & DEBUG ====
  const [debug, setDebug] = useState(false);
  const worldRef = useRef(null);

  // ==== OBSTACLES ====
  const [obstacles, setObstacles] = useState(() => {
    return loadObstaclesFromStorage(STORAGE_KEY) ?? getDefaultObstacles();
  });

  // ==== PINTU ====
  const [doorZone, setDoorZone] = useState(null); // {x,y,width,height}
  const [nearDoor, setNearDoor] = useState(false);

  // ==== PLAYER VISUAL / LOGIC ====
  const spriteRef = useRef(null);
  const posRef = useRef({ x: 300, y: 300 });
  const keysPressed = useRef({});
  const movingRef = useRef(false);

  // arah & anim (2 frame)
  const [direction, setDirection] = useState("down");
  const [step, setStep] = useState(1);
  const [toggleAnimFlag, setToggleAnimFlag] = useState(false);

  // ==== SPRITE TABLE ====
  const spriteFrames = {
    down: ["backleft.png"],
    up: ["frontleft.png"],
    right: ["kanan.png"],
    left: ["kirifix.png"],
  };
  const getCharacterSprite = (dir, stp) => {
    const frames = spriteFrames[dir] || spriteFrames.down;
    return frames[(stp - 1) % frames.length];
  };

  /** ==== DOOR ZONE MANUAL: ambil bibir bawah obstacle rumah ==== */
useEffect(() => {
  const house = obstacles.find(o => o.id === HOUSE_RECT_ID_FOR_DOOR);
  if (!house) { setDoorZone(null); return; }

  const width = 80;    // lebar pintu
  const height = 40;   // tinggi zona interaksi
  const x = house.x + (house.w - width) / 2;

  // offset Y: geser ke bawah biar sejajar tanah
  const offsetY = 20; // coba dulu 20px, nanti bisa di-tweak
  const y = house.y + house.h - height + offsetY;

  setDoorZone({ x, y, width, height });
}, [obstacles]);


  /** ==== INPUT (WASD + SHIFT) ==== */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Shift") {
        setDebug(true);
        return;
      }
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e) => {
      if (e.key === "Shift") {
        setDebug(false);
        return;
      }
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  /** ==== Tekan 'E' hanya jika dekat pintu ==== */
  useDoorEnter({ enabled: nearDoor, onEnter: onEnterHouse });

  /** ==== GAME LOOP ==== */
  useEffect(() => {
    let raf;
    let last = performance.now();
    const solidRects = obstacles.filter((o) => o.type !== "spawn");

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      let ax = 0,
        ay = 0;
      if (keysPressed.current["w"]) {
        ay -= 1;
        setDirection("up");
      }
      if (keysPressed.current["s"]) {
        ay += 1;
        setDirection("down");
      }
      if (keysPressed.current["a"]) {
        ax -= 1;
        setDirection("left");
      }
      if (keysPressed.current["d"]) {
        ax += 1;
        setDirection("right");
      }

      const len = Math.hypot(ax, ay);
      let dx = 0,
        dy = 0;
      if (len > 0) {
        dx = (ax / len) * SPEED * dt;
        dy = (ay / len) * SPEED * dt;
      }

      const curr = posRef.current;
      const hb = {
        x: curr.x + HITBOX.offsetX,
        y: curr.y + HITBOX.offsetY,
        w: HITBOX.w,
        h: HITBOX.h,
      };

      let moved = hb;
      if (COLLISION_ENABLED && (dx || dy)) {
        moved = moveWithCollisionAxis(hb, dx, dy, solidRects); // expect {x,y,w,h}
      } else {
        moved = { ...hb, x: hb.x + dx, y: hb.y + dy };
      }

      const next = { x: moved.x - HITBOX.offsetX, y: moved.y - HITBOX.offsetY };
      if (next.x !== curr.x || next.y !== curr.y) {
        posRef.current = next;
        if (spriteRef.current) {
          spriteRef.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
        }
      }

      const movingNow = len > 0;
      if (movingRef.current !== movingNow) {
        movingRef.current = movingNow;
        setToggleAnimFlag((f) => !f);
      }

      // ==== DETEKSI NEAR DOOR (konversi w/h → width/height) ====
      if (doorZone) {
        const movedBox = {
          x: moved.x,
          y: moved.y,
          width: moved.w,
          height: moved.h,
        };
        const near = overlaps(movedBox, doorZone); // doorZone sudah width/height
        setNearDoor(!!near);
      } else {
        setNearDoor(false);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [obstacles, doorZone]);

  /** ==== Anim kaki ==== */
  useEffect(() => {
    let id;
    if (movingRef.current) {
      id = setInterval(() => setStep((p) => (p === 1 ? 2 : 1)), 130);
    } else {
      setStep(1);
    }
    return () => clearInterval(id);
  }, [toggleAnimFlag]);

  /** ==== SPAWN ==== */
  useEffect(() => {
    const spawn = obstacles.find((o) => o.type === "spawn");
    if (!spawn) return;
    const x = spawn.x - HITBOX.offsetX + (spawn.w - HITBOX.w) / 2;
    const y = spawn.y - HITBOX.offsetY + (spawn.h - HITBOX.h) / 2;
    posRef.current = { x, y };
    if (spriteRef.current) {
      spriteRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, [obstacles]);

  return (
    <div
      ref={worldRef}
      style={{
        width: "100vw",
        height: "100vh",
        backgroundImage: 'url("/assets/maps/yardmap.png")',
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        position: "relative", // penting buat hint absolute
        overflow: "hidden",
      }}
    >
      {/* Visual collision (opsional) */}
      {SHOW_COLLISION_VISUAL &&
        obstacles.map((o) => (
          <div
            key={o.id}
            style={{
              position: "absolute",
              left: o.x,
              top: o.y,
              width: o.w,
              height: o.h,
              background: "rgba(255,255,0,0.2)",
              border: "1px solid orange",
              pointerEvents: "none",
              zIndex: 8,
            }}
          />
        ))}

      {/* Debug door zone */}


      {/* Hint E tepat di atas bibir pintu */}
      {doorZone && (
  <DoorHint
    show={nearDoor}
    x={doorZone.x + doorZone.width / 2}
    y={doorZone.y - 6}  // sedikit naik
    text="Tekan E untuk interaksi dengan pintu"
  />
)}


      {/* Player */}
      <img
        ref={spriteRef}
        src={`/assets/characters/${getCharacterSprite(direction, step)}`}
        alt="player"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 150,
          height: 150,
          transform: "translate3d(0,0,0)",
          willChange: "transform",
          imageRendering: "pixelated",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />


      {/* Editor overlay (tahan SHIFT) */}
      <DebugCollisionOverlay
        active={debug}
        rects={obstacles}
        setRects={setObstacles}
        containerRef={worldRef}
        storageKey={STORAGE_KEY}
      />
    </div>
  );
}
