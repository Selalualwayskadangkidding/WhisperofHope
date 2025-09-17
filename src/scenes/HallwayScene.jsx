// src/scenes/HallwayScene.jsx
import { useEffect, useRef, useState } from "react";
import DebugCollisionOverlay from "../mechanics/DebugCollisionOverlay.jsx";
import { moveWithCollisionAxis } from "../mechanics/collision.js";
import { overlaps, makeDoorZone } from "../mechanics/doors.js";
import useDoorEnter from "../mechanics/useDoorEnter.js";
import DoorHint from "../components/DoorHint.jsx";

import {
  HW_STORAGE_KEY,
  getDefaultHallwayObstacles,
  loadHallwayObstaclesFromStorage,
} from "../data/hallwayObstacles.js";
import "../styles/hallway.css";

/** ================== KONFIG GLOBAL ================== */
const COLLISION_ENABLED = true;
const SHOW_COLLISION_VISUAL = false;
const SHOW_DOOR_DEBUG_BOX = false;
const SHOW_HINT_DEBUG_TEXT = false;

const HITBOX = { offsetX: 65, offsetY: 135, w: 20, h: 15 };
const SPEED = 180; // px/s

/** ================== SPRITE TABLE ================== */
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

/** =========================================================
 *  ID OBSTACLE PINTU (NGIKUT LOCALSTORAGE HALLWAY LU)
 *  - 6 : balik ke Living Room
 *  - 7 : Kamar Kakak
 *  - 8 : Kamar Ayah Ibu
 *  - 9 : Dapur
 *  - 10: Kamar Mandi
 * ========================================================= */
const OBST_BACK_TO_LR_ID  = 6;
const OBST_KAMAR_KAKAK_ID = 7;
const OBST_KAMAR_ORTU_ID  = 8;
const OBST_DAPUR_ID       = 9;
const OBST_KAMAR_MANDI_ID = 10;

/** Bangun list doors dari obstacles (zona dari makeDoorZone) */
function buildDoorsFromObstacles(obstacles) {
  const opt = { pad: 6 }; // sedikit pelebaran biar gampang kena
  const backLR = makeDoorZone(obstacles, OBST_BACK_TO_LR_ID, opt);
  const kakak  = makeDoorZone(obstacles, OBST_KAMAR_KAKAK_ID, opt);
  const ortu   = makeDoorZone(obstacles, OBST_KAMAR_ORTU_ID, opt);
  const dapur  = makeDoorZone(obstacles, OBST_DAPUR_ID, opt);
  const mandi  = makeDoorZone(obstacles, OBST_KAMAR_MANDI_ID, opt);

  const out = [];
  if (backLR) out.push({ id: "back_to_lr",  rect: backLR, label: "Kembali ke Ruang Tamu", onEnterProp: "onBackLivingRoom" });
  if (kakak)  out.push({ id: "kamar_kakak", rect: kakak,  label: "Masuk Kamar Kakak",    onEnterProp: "onEnterKamarKakak" });
  if (ortu)   out.push({ id: "kamar_ortu",  rect: ortu,   label: "Masuk Kamar Ayah Ibu", onEnterProp: "onEnterKamarOrtu" });
  if (dapur)  out.push({ id: "dapur",       rect: dapur,  label: "Masuk Dapur",          onEnterProp: "onEnterDapur" });
  if (mandi)  out.push({ id: "kamar_mandi", rect: mandi,  label: "Masuk Kamar Mandi",    onEnterProp: "onEnterKamarMandi" });
  return out;
}

export default function HallwayScene({
  onBackLivingRoom,   // () => void
  onEnterKamarKakak,  // () => void
  onEnterKamarOrtu,   // () => void
  onEnterDapur,       // () => void
  onEnterKamarMandi,  // () => void
}) {
  // ==== UI & DEBUG ====
  const [debug, setDebug] = useState(false);
  const worldRef = useRef(null);

  // ==== OBSTACLES ====
  const [obstacles, setObstacles] = useState(() => {
    return loadHallwayObstaclesFromStorage() ?? getDefaultHallwayObstacles();
  });

  // ==== DOOR STATE ====
  const [nearDoorId, setNearDoorId] = useState(null); // id door yg sedang didekati

  // ==== PLAYER VISUAL / LOGIC ====
  const spriteRef = useRef(null);
  const posRef = useRef({ x: 300, y: 300 });
  const keysPressed = useRef({});
  const movingRef = useRef(false);

  const [direction, setDirection] = useState("down");
  const [step, setStep] = useState(1);
  const [toggleAnimFlag, setToggleAnimFlag] = useState(false);

  /** ===== INPUT (WASD + SHIFT) ===== */
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

  /** ===== Tekan 'E' hanya jika dekat salah satu pintu ===== */
  useDoorEnter({
    enabled: !!nearDoorId,
    onEnter: () => {
      const doors = buildDoorsFromObstacles(obstacles);
      const door = doors.find((d) => d.id === nearDoorId);
      if (!door) return;
      const map = {
        onBackLivingRoom,
        onEnterKamarKakak,
        onEnterKamarOrtu,
        onEnterDapur,
        onEnterKamarMandi,
      };
      const fn = map[door.onEnterProp];
      if (typeof fn === "function") fn();
    },
  });

  /** ================= GAME LOOP ================= */
  useEffect(() => {
    let raf;
    let last = performance.now();

    // collision: semua kecuali spawn (pola lama)
    const solidRects = obstacles.filter((o) => o.type !== "spawn");

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      let ax = 0, ay = 0;
      if (keysPressed.current["w"]) { ay -= 1; setDirection("up"); }
      if (keysPressed.current["s"]) { ay += 1; setDirection("down"); }
      if (keysPressed.current["a"]) { ax -= 1; setDirection("left"); }
      if (keysPressed.current["d"]) { ax += 1; setDirection("right"); }

      const len = Math.hypot(ax, ay);
      let dx = 0, dy = 0;
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
        // NOTE: signature moveWithCollisionAxis(hb, dx, dy, solids) mengikuti code lu
        moved = moveWithCollisionAxis(hb, dx, dy, solidRects);
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

      // ==== DETEKSI NEAR DOOR ====
      const doors = buildDoorsFromObstacles(obstacles);
      const movedBoxWH = { x: moved.x, y: moved.y, width: moved.w, height: moved.h };
      const feet = { x: moved.x + moved.w / 2, y: moved.y + moved.h };
      const center = (r) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
      const DIST_THRESH = 80;

      // toleransi overlap biar gampang kena
      const grow = (r, m = 6) => ({
        x: r.x - m,
        y: r.y - m,
        width: r.width + 2 * m,
        height: r.height + 2 * m,
      });

      let found = null;
      for (const d of doors) {
        if (overlaps(movedBoxWH, grow(d.rect, 6))) {
          const c = center(d.rect);
          const dist = Math.hypot(feet.x - c.x, feet.y - c.y);
          if (dist < DIST_THRESH) {
            found = d.id;
            break;
          }
        }
      }
      setNearDoorId(found);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [obstacles]);

  /** ===== Anim kaki ===== */
  useEffect(() => {
    let id;
    if (movingRef.current) {
      id = setInterval(() => setStep((p) => (p === 1 ? 2 : 1)), 130);
    } else {
      setStep(1);
    }
    return () => clearInterval(id);
  }, [toggleAnimFlag]);

  /** ===== SPAWN (baca hv_next_spawn_id kalau ada) ===== */
  useEffect(() => {
    const nextId = Number(localStorage.getItem("hv_next_spawn_id") || "0");
    const spawn = (nextId
      ? obstacles.find((o) => o.type === "spawn" && o.id === nextId)
      : null) || obstacles.find((o) => o.type === "spawn");
    if (!spawn) return;
    const x = spawn.x - HITBOX.offsetX + (spawn.w - HITBOX.w) / 2;
    const y = spawn.y - HITBOX.offsetY + (spawn.h - HITBOX.h) / 2;
    posRef.current = { x, y };
    if (spriteRef.current) {
      spriteRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, [obstacles]);

  /** ================= RENDER ================= */
  const doors = buildDoorsFromObstacles(obstacles);
  const currDoor = doors.find((d) => d.id === nearDoorId);

  return (
    <div className="hw-root">
      <div className="hw-stage" ref={worldRef}>
        {/* Map */}
        <img
          src="/assets/maps/hallway.png"
          alt="hallway"
          className="hw-map pixelated"
        />

        {/* Player */}
        <img
          ref={spriteRef}
          src={`/assets/characters/${getCharacterSprite(direction, step)}`}
          alt="player"
          className="hw-player pixelated"
          style={{
            transform: "translate3d(0,0,0)",
            width: 150,
            height: 150,
            zIndex: 10,
          }}
        />

        {/* Hint pintu */}
        {currDoor && (
          <DoorHint
            show={!!nearDoorId}
            x={currDoor.rect.x + currDoor.rect.width / 2}
            y={currDoor.rect.y - 6}
            text={`Tekan E — ${currDoor.label}`}
          />
        )}

        {/* Debug collision statis */}
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
                background:
                  o.type === "spawn"
                    ? "rgba(0,255,0,0.15)"
                    : "rgba(255,255,0,0.2)",
                border: "1px solid orange",
                pointerEvents: "none",
                zIndex: 8,
              }}
            />
          ))}

        {/* Debug door box */}
        {SHOW_DOOR_DEBUG_BOX &&
          doors.map((d) => (
            <div
              key={d.id}
              style={{
                position: "absolute",
                left: d.rect.x,
                top: d.rect.y,
                width: d.rect.width,
                height: d.rect.height,
                background: "rgba(0,255,0,0.15)",
                border: "1px dashed #00ff00",
                zIndex: 7,
                pointerEvents: "none",
              }}
            />
          ))}

        {/* Overlay editor (SHIFT untuk aktif) */}
        <div style={{ position: "absolute", inset: 0, zIndex: 99, pointerEvents: "auto" }}>
          <DebugCollisionOverlay
            active={debug}
            rects={obstacles}
            setRects={setObstacles}
            containerRef={worldRef}
            storageKey={HW_STORAGE_KEY}
          />
        </div>

        {/* Debug pojok */}
        {SHOW_HINT_DEBUG_TEXT && (
          <div className="debug-corner">nearDoorId: {String(nearDoorId)}</div>
        )}
      </div>
    </div>
  );
}
