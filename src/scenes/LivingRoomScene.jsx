// src/scenes/LivingRoomScene.jsx
import { useEffect, useRef, useState } from "react";
import DebugCollisionOverlay from "../mechanics/DebugCollisionOverlay.jsx";
import { moveWithCollisionAxis } from "../mechanics/collision.js";
import DoorHint from "../components/DoorHint.jsx";
import { overlaps } from "../mechanics/doors.js";
import useDoorEnter from "../mechanics/useDoorEnter.js";
import {
  LR_STORAGE_KEY,
  getDefaultLivingroomObstacles,
  loadLivingroomObstaclesFromStorage,
} from "../data/livingroomObstacles.js";
import "../styles/livingroom.css";

/** ===== KOORDINAT PINTU KE YARD (dari file kamu) ===== */
const DOOR_YARD_ZONE = {               // Tekan E → ke Yard
  x: 408.1481481481482,
  y: 588.1481481481482,
  width: 20,
  height: 14,
};

/** ===== Konstanta Map & Player ===== */
const MAP_W = 1280;
const MAP_H = 720;

const SPRITE_W = 128; // karakter gede
const SPRITE_H = 128;

// hitbox “kaki”
const HITBOX = { offsetX: SPRITE_W / 2 - 10, offsetY: SPRITE_H - 22, w: 20, h: 14 };
const SPEED = 180;

// zoom stage (tetap di tengah)
const STAGE_ZOOM = 1.35;

/** ===== Helper: bikin “zona depan” suatu obstacle (di luar rect, sisi bawah) =====
 * Digunakan untuk pintu Hallway yang nempel obstacle id:9 (type "solid").
 * Param `gap` = jarak vertikal kecil dari tepi bawah obstacle, biar gak nabrak collision.
 */
function makeFrontZone(obstacles, targetId, {
  padX = 12,     // pinggir kiri/kanan diperkecil
  height = 22,   // tinggi zona
  gap = 6,       // jarak dari tepi bawah obstacle
  maxWidth = 80, // batasi lebar maksimum
} = {}) {
  const obj = obstacles.find(o => o.id === targetId);
  if (!obj) return null;

  const width = Math.min(maxWidth, Math.max(32, obj.w - padX * 2));
  const x = Math.floor(obj.x + (obj.w - width) / 2);
  const y = Math.floor(obj.y + obj.h + gap); // DI DEPAN (di luar rect)
  return { x, y, width, height };
}

export default function LivingRoomScene({
  onExitToHallway,  // dari App.jsx
  onExitToYard,     // dari App.jsx
  onChangeScene,    // opsional
}) {
  const [scale] = useState(STAGE_ZOOM);

  // ======= DEBUG / OVERLAY =======
  const [debug, setDebug] = useState(false);
  const stageRef = useRef(null);

  // ======= OBSTACLES =======
  const [obstacles, setObstacles] = useState(
    () => loadLivingroomObstaclesFromStorage() ?? getDefaultLivingroomObstacles()
  );

  // ======= PLAYER =======
  const spriteRef = useRef(null);
  const posRef = useRef({ x: MAP_W / 2 - SPRITE_W / 2, y: MAP_H - 150 });
  const keys = useRef({});
  const movingRef = useRef(false);

  const [direction, setDirection] = useState("down");
  const [step, setStep] = useState(1);
  const [toggleAnimFlag, setToggleAnimFlag] = useState(false);

  // state “dekat pintu mana”
  const [nearYard, setNearYard] = useState(false);
  const [nearHall, setNearHall] = useState(false);
  const [hallZone, setHallZone] = useState(null); // zona Hallway dinamis dari obstacle id:9

  const spriteFrames = {
    down: ["backleft.png"],
    up: ["frontleft.png"],
    right: ["kanan.png"],
    left: ["kirifix.png"],
  };
  const getSprite = (dir, stp) => {
    const frames = spriteFrames[dir] || spriteFrames.down;
    return `/assets/characters/${frames[(stp - 1) % frames.length]}`;
  };

  // ======= INPUT: WASD/Arrow + SHIFT toggle overlay + R reset default saat debug =======
  useEffect(() => {
    const down = (e) => {
      if (e.key === "Shift") {
        setDebug(true);
        return;
      }
      if (e.key.toLowerCase() === "r" && debug) {
        localStorage.removeItem(LR_STORAGE_KEY);
        setObstacles(getDefaultLivingroomObstacles()); // reset default
        return;
      }
      keys.current[e.key.toLowerCase()] = true;
    };
    const up = (e) => {
      if (e.key === "Shift") {
        setDebug(false);
        return;
      }
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [debug]);

  // ======= Tekan 'E' saat dekat salah satu pintu =======
  useDoorEnter({
    enabled: nearYard || nearHall,
    onEnter: () => {
      // Re-check posisi TERKINI biar anti-stale
      const curr = posRef.current;
      const hbNow = {
        x: curr.x + HITBOX.offsetX,
        y: curr.y + HITBOX.offsetY,
        w: HITBOX.w,
        h: HITBOX.h,
      };
      const inHall = hallZone ? overlaps(hbNow, hallZone) : false;
      const inYard = overlaps(hbNow, DOOR_YARD_ZONE);

      if (inHall && typeof onExitToHallway === "function") {
        onExitToHallway();
      } else if (inYard && typeof onExitToYard === "function") {
        onExitToYard();
      }
      // kalau tidak overlap keduanya (edge case), tidak melakukan apa-apa
    },
  });

  // ======= SPAWN dari obstacle type 'spawn' =======
  useEffect(() => {
    const spawn = obstacles.find((o) => o.type === "spawn");
    if (!spawn) return;
    const sx = spawn.x + (spawn.w - HITBOX.w) / 2 - HITBOX.offsetX;
    const sy = spawn.y + (spawn.h - HITBOX.h) / 2 - HITBOX.offsetY;
    posRef.current = { x: sx, y: sy };
    if (spriteRef.current) {
      spriteRef.current.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
    }
  }, [obstacles]);

  // ======= Hitung zona Hallway dari obstacle id:9 tiap obstacles berubah =======
  useEffect(() => {
    setHallZone(makeFrontZone(obstacles, 9, { padX: 0, height: 28, gap: 2, maxWidth: 110 }));
  }, [obstacles]);

  // ======= GAME LOOP =======
  useEffect(() => {
    let raf;
    let last = performance.now();

    // solids: JANGAN masukkan spawn/door
    const solids = obstacles.filter((o) => o.type !== "spawn" && o.type !== "door");

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      // Arah input
      let ax = 0, ay = 0;
      const k = keys.current;
      if (k["w"] || k["arrowup"])    { ay -= 1; setDirection("up"); }
      if (k["s"] || k["arrowdown"])  { ay += 1; setDirection("down"); }
      if (k["a"] || k["arrowleft"])  { ax -= 1; setDirection("left"); }
      if (k["d"] || k["arrowright"]) { ax += 1; setDirection("right"); }

      // Normalisasi + kecepatan
      const len = Math.hypot(ax, ay);
      let dx = 0, dy = 0;
      if (len > 0) {
        dx = (ax / len) * SPEED * dt;
        dy = (ay / len) * SPEED * dt;
      }

      // Hitbox kaki
      const curr = posRef.current;
      const hb = {
        x: curr.x + HITBOX.offsetX,
        y: curr.y + HITBOX.offsetY,
        w: HITBOX.w,
        h: HITBOX.h,
      };

      // Collision axis-per-axis
      let moved = (dx || dy) ? moveWithCollisionAxis(hb, dx, dy, solids) : hb;

      // Clamp ke batas map
      moved.x = Math.max(0, Math.min(MAP_W - moved.w, moved.x));
      moved.y = Math.max(0, Math.min(MAP_H - moved.h, moved.y));

      // Posisi sprite dari hitbox
      const next = { x: moved.x - HITBOX.offsetX, y: moved.y - HITBOX.offsetY };
      if (next.x !== curr.x || next.y !== curr.y) {
        posRef.current = next;
        if (spriteRef.current) {
          spriteRef.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
        }
      }

      // ======= Door checks (dua zona) =======
      const movedBox = { x: moved.x, y: moved.y, width: moved.w, height: moved.h };
      setNearYard(overlaps(movedBox, DOOR_YARD_ZONE));
      setNearHall(hallZone ? overlaps(movedBox, hallZone) : false);

      // Toggle anim
      const movingNow = len > 0;
      if (movingRef.current !== movingNow) {
        movingRef.current = movingNow;
        setToggleAnimFlag((f) => !f);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [obstacles, hallZone]); // rebind loop ketika hallZone berubah

  // ======= Anim kaki (kalau nanti >1 frame) =======
  useEffect(() => {
    let id;
    if (movingRef.current) id = setInterval(() => setStep((p) => (p === 1 ? 2 : 1)), 130);
    else setStep(1);
    return () => clearInterval(id);
  }, [toggleAnimFlag]);

  return (
    <div className="lr-root">
      <div
        className="lr-stage"
        ref={stageRef}
        style={{ width: MAP_W, height: MAP_H, transform: `scale(${scale})` }}
      >
        {/* MAP */}
        <img
          src="/assets/maps/livingroom.png"
          alt="livingroom"
          className="lr-map pixelated"
          draggable={false}
        />

        {/* Hints */}
        <DoorHint
          show={nearYard}
          x={DOOR_YARD_ZONE.x + DOOR_YARD_ZONE.width / 2}
          y={DOOR_YARD_ZONE.y - 6}
          text="Tekan E untuk ke Yard"
        />
        {/* DEBUG: visualisasi zona pintu saat tahan Shift */}
{debug && (
  <>
    {/* Hallway zone */}
    {hallZone && (
      <div
        style={{
          position: "absolute",
          left: hallZone.x,
          top: hallZone.y,
          width: hallZone.width,
          height: hallZone.height,
          outline: "2px dashed #00e5ff",
          pointerEvents: "none",
        }}
      />
    )}
    {/* Yard zone */}
    <div
      style={{
        position: "absolute",
        left: DOOR_YARD_ZONE.x,
        top: DOOR_YARD_ZONE.y,
        width: DOOR_YARD_ZONE.width,
        height: DOOR_YARD_ZONE.height,
        outline: "2px dashed #9eff00",
        pointerEvents: "none",
      }}
    />
  </>
)}


        {/* PLAYER */}
        <img
          ref={spriteRef}
          src={getSprite(direction, step)}
          alt="player"
          className="lr-player pixelated"
          style={{
            width: SPRITE_W,
            height: SPRITE_H,
            transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`,
          }}
          draggable={false}
        />

        {/* OVERLAY: tahan SHIFT */}
        <DebugCollisionOverlay
          active={debug}
          rects={obstacles}
          setRects={setObstacles}
          containerRef={stageRef}
          storageKey={LR_STORAGE_KEY}
          scale={scale} // penting karena stage di-zoom
        />
      </div>
    </div>
  );
}
