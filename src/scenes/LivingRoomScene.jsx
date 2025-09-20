// src/scenes/LivingRoomScene.jsx
import { useEffect, useRef, useState } from "react";
import DebugCollisionOverlay from "../mechanics/DebugCollisionOverlay.jsx";
import { moveWithCollisionAxis } from "../mechanics/collision.js";
import DoorHint from "../components/DoorHint.jsx";
import { overlaps as doorOverlaps } from "../mechanics/doors.js";
import useDoorEnter from "../mechanics/useDoorEnter.js";
import {
  LR_STORAGE_KEY,
  getDefaultLivingroomObstacles,
  loadLivingroomObstaclesFromStorage,
} from "../data/livingroomObstacles.js";
import "../styles/livingroom.css";

/** ===== Mekanik bersihin (data & helper) ===== */
import {
  loadLivingroomTrash,
  markTrashClean,
  getNewlyUnlockedItems,
  computeProgress,
} from "../data/livingroomTrash.js";
import {
  overlaps as aabbOverlaps,
  makeRect,
  useInteractKey,
  useKeyHold,
} from "../mechanics/interact.js";

/** ===== Komponen UI ===== */
import InteractHint from "../components/InteractHint.jsx";
import TrashSprite from "../components/TrashSprite.jsx";
import CleanlinessHUD from "../components/CleanlinessHUD.jsx";
import WipeBar from "../components/WipeBar.jsx";
import "../styles/cleaning.css";

/** ===== Editor penempatan trash rects ===== */
import {
  LR_TRASH_RECTS_KEY,
  getDefaultLivingroomTrashRects,
} from "../data/livingroomTrashRects.js";

/** ===== KOORDINAT PINTU KE YARD ===== */
const DOOR_YARD_ZONE = {
  x: 408.1481481481482,
  y: 588.1481481481482,
  width: 20,
  height: 14,
};

/** ===== Konstanta Map & Player ===== */
const MAP_W = 1280;
const MAP_H = 720;

const SPRITE_W = 128;
const SPRITE_H = 128;

// hitbox “kaki”
const HITBOX = { offsetX: SPRITE_W / 2 - 10, offsetY: SPRITE_H - 22, w: 20, h: 14 };
const SPEED = 180;

// zoom stage (tetap di tengah)
const STAGE_ZOOM = 1.35;

/** ===== Helper: bikin “zona depan” suatu obstacle (di luar rect, sisi bawah) =====
 * Digunakan untuk pintu Hallway yang nempel obstacle id:9 (type "solid").
 */
function makeFrontZone(
  obstacles,
  targetId,
  { padX = 12, height = 22, gap = 6, maxWidth = 80 } = {}
) {
  const obj = obstacles.find((o) => o.id === targetId);
  if (!obj) return null;

  const width = Math.min(maxWidth, Math.max(32, obj.w - padX * 2));
  const x = Math.floor(obj.x + (obj.w - width) / 2);
  const y = Math.floor(obj.y + obj.h + gap); // DI DEPAN (di luar rect)
  return { x, y, width, height };
}

export default function LivingRoomScene({
  onExitToHallway, // dari App.jsx
  onExitToYard,    // dari App.jsx
  onChangeScene,   // opsional
}) {
  const [scale] = useState(STAGE_ZOOM);

  // ======= DEBUG / OVERLAY =======
  const [debug, setDebug] = useState(false);
  const stageRef = useRef(null);

  // ======= OBSTACLES =======
  const [obstacles, setObstacles] = useState(
    () => loadLivingroomObstaclesFromStorage() ?? getDefaultLivingroomObstacles()
  );

  // ======= TRASH-RECT EDITOR =======
  const [trashRects, setTrashRects] = useState(getDefaultLivingroomTrashRects());
  // "world" = edit obstacles; "trash" = edit penempatan trash
  const [editMode, setEditMode] = useState("world");

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

  // ======= CLEANING STATE =======
  const [trashList, setTrashList] = useState(() => loadLivingroomTrash()); // item aktif
  const [focusId, setFocusId] = useState(null); // item yang sedang di-aim
  const [progress, setProgress] = useState(0);  // 0..100
  const [checklist, setChecklist] = useState({});
  const [wipeActive, setWipeActive] = useState(false); // minigame lap noda
  const interact = useInteractKey("KeyE", 180);
  const holdE = useKeyHold("KeyE");
  const wipingTargetRef = useRef(null); // <-- simpan target stain saat mulai lap

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

  // progress awal
  useEffect(() => {
    const { percent, checklist: cl } = computeProgress();
    setProgress(percent);
    setChecklist(cl);
  }, []);

  // ======= Seed trash dari editor kalau loader kosong =======
  useEffect(() => {
    if (trashList && trashList.length > 0) return;
    if (!trashRects || trashRects.length === 0) return;

    // bentuk item default dari rect editor
    const seeded = trashRects.map((r, i) => ({
      id: r.id ?? `trash_${i}`,
      x: r.x,
      y: r.y,
      w: r.w ?? 24,
      h: r.h ?? 24,
      type: r.type ?? "pickup", // "pickup" | "stain"
      sprite: r.sprite ?? "/assets/ui/trash/trash1.png",
      label: r.label ?? "Sampah",
    }));

    setTrashList(seeded);
    // (opsional) kalau mau persist bisa simpan ke storage di modul data
    // saveLivingroomTrash(seeded)
    // atau biar stateless cukup set state saja.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // hanya saat mount

  // ======= INPUT =======
  useEffect(() => {
    const down = (e) => {
      if (e.key === "Shift") {
        setDebug(true);
        return;
      }
      if (e.key.toLowerCase() === "r" && debug) {
        // reset obstacles ke default (mode world)
        localStorage.removeItem(LR_STORAGE_KEY);
        setObstacles(getDefaultLivingroomObstacles());
        return;
      }
      if (e.key.toLowerCase() === "t" && debug) {
        // toggle target overlay saat debug ON
        setEditMode((m) => (m === "world" ? "trash" : "world"));
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
      if (k["w"] || k["arrowup"]) { ay -= 1; setDirection("up"); }
      if (k["s"] || k["arrowdown"]) { ay += 1; setDirection("down"); }
      if (k["a"] || k["arrowleft"]) { ax -= 1; setDirection("left"); }
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
      setNearYard(doorOverlaps(movedBox, DOOR_YARD_ZONE));

      // Gate hallway: hanya aktif jika progress >= 70
      const hallOverlap = hallZone ? doorOverlaps(movedBox, hallZone) : false;
      setNearHall(hallOverlap && progress >= 70);

      // Toggle anim
      const movingNow = len > 0;
      if (movingRef.current !== movingNow) {
        movingRef.current = movingNow;
        setToggleAnimFlag((f) => !f);
        // Optional: anim step kalau ada multiple frame
        setStep((s) => (movingNow ? (s % 2) + 1 : 1));
      }

      // ======= CLEANING: fokus item terdekat yang overlap =======
      const playerHB = makeRect(moved.x, moved.y, moved.w, moved.h);
      let nearest = null;
      let nearestDist2 = Infinity;

      for (const it of trashList) {
        const hit = makeRect(it.x, it.y, it.w, it.h);
        if (!aabbOverlaps(playerHB, hit)) continue;
        const cx = hit.x + hit.w / 2;
        const cy = hit.y + hit.h / 2;
        const px = playerHB.x + playerHB.w / 2;
        const py = playerHB.y + playerHB.h / 2;
        const d2 = (px - cx) * (px - cx) + (py - cy) * (py - cy);
        if (d2 < nearestDist2) {
          nearestDist2 = d2;
          nearest = it;
        }
      }
      setFocusId(nearest ? nearest.id : null);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obstacles, hallZone, progress, trashList.length]);

  // ======= Tekan 'E' saat dekat salah satu pintu =======
  useDoorEnter({
    // FIX: jangan aktif kalau lagi fokus item atau minigame → hindari dobel E
    enabled: (nearYard || nearHall) && !focusId && !wipeActive,
    onEnter: () => {
      const curr = posRef.current;
      const hbNow = {
        x: curr.x + HITBOX.offsetX,
        y: curr.y + HITBOX.offsetY,
        w: HITBOX.w,
        h: HITBOX.h,
      };
      const inHall = hallZone ? doorOverlaps(hbNow, hallZone) : false;
      const inYard = doorOverlaps(hbNow, DOOR_YARD_ZONE);

      if (inHall && progress >= 70 && typeof onExitToHallway === "function") {
        onExitToHallway();
      } else if (inYard && typeof onExitToYard === "function") {
        onExitToYard();
      }
    },
  });

  // ======= CLEANING: handle tekan E pada item fokus =======
  useEffect(() => {
    if (!interact.pressed) return;
    if (wipeActive) return; // kalau lagi minigame, abaikan interaksi baru

    // Prioritaskan pintu bila memang di pintu (dan ga lagi fokus item)
    if ((nearYard || nearHall) && !focusId) return;

    const target = trashList.find((t) => t.id === focusId);
    if (!target) return;

    if (target.type === "stain") {
      wipingTargetRef.current = target.id; // FIX: simpan target stain saat mulai lap
      setWipeActive(true);
      return;
    }

    performClean(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interact.pressed]);

  function performClean(item) {
    markTrashClean(item.id);

    setTrashList((prev) => prev.filter((t) => t.id !== item.id));

    const unlocked = getNewlyUnlockedItems(item.id);
    if (unlocked.length) setTrashList((prev) => [...prev, ...unlocked]);

    const { percent, checklist: cl } = computeProgress();
    setProgress(percent);
    setChecklist(cl);
  }

  // ======= WipeBar callbacks =======
  function handleWipeDone() {
    setWipeActive(false);
    const id = wipingTargetRef.current;
    if (!id) return;
    const target = trashList.find((t) => t.id === id);
    if (target && target.type === "stain") performClean(target);
    wipingTargetRef.current = null;
  }
  function handleWipeCancel() {
    setWipeActive(false);
    wipingTargetRef.current = null;
  }

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

        {/* SPRITE SAMPAH — aktif (ukuran dari loader: w,h) */}
        {trashList.map((it) => (
          <TrashSprite
            key={it.id}
            x={it.x}
            y={it.y}
            w={it.w}
            h={it.h}
            sprite={it.sprite}
            alt={it.label}
            z={3}
            focused={it.id === focusId} // QoL: bisa dipakai buat outline glow di komponen
            style={{ cursor: "pointer" }} // QoL: rasa interaktif
          />
        ))}

        {/* Hints pintu */}
        <DoorHint
          show={nearYard}
          x={DOOR_YARD_ZONE.x + DOOR_YARD_ZONE.width / 2}
          y={DOOR_YARD_ZONE.y - 6}
          text="Tekan E untuk ke Yard"
        />

        {/* Hall door hint: beda teks kalau belum 70% */}
        {hallZone && (
          <DoorHint
            show={
              hallZone &&
              doorOverlaps(
                {
                  x: posRef.current.x + HITBOX.offsetX,
                  y: posRef.current.y + HITBOX.offsetY,
                  width: HITBOX.w,
                  height: HITBOX.h,
                },
                hallZone
              )
            }
            x={hallZone.x + hallZone.width / 2}
            y={hallZone.y - 6}
            text={progress >= 70 ? "Tekan E untuk ke Hallway" : "Bersihkan ≥ 70% untuk buka pintu"}
          />
        )}

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

        {/* HINT INTERAKSI SAMPAH (fokus item terdekat) */}
        {(() => {
          const target = trashList.find((t) => t.id === focusId);
          if (!target) return null;
          const label =
            target.type === "stain" ? "Tahan E untuk mengelap" : `Tekan E — ${target.label}`;
          const cx = target.x + target.w / 2;
          const cy = target.y + target.h / 2 - 10;
          return <InteractHint visible x={cx} y={cy} text={label} />;
        })()}

        {/* HUD Kebersihan */}
        <CleanlinessHUD progress={progress} checklist={checklist} />

        {/* WipeBar untuk noda */}
        <WipeBar
          active={wipeActive}
          holding={holdE}
          requiredMs={1000}
          onDone={handleWipeDone}
          onCancel={handleWipeCancel}
        />

        {/* ===== OVERLAYS (tahan SHIFT) ===== */}
        {/* WORLD (obstacles) */}
        <DebugCollisionOverlay
          active={debug && editMode === "world"}
          rects={obstacles}
          setRects={setObstacles}
          containerRef={stageRef}
          storageKey={LR_STORAGE_KEY}
          scale={scale}
        />

        {/* TRASH (penempatan kotoran) */}
        <DebugCollisionOverlay
          active={debug && editMode === "trash"}
          rects={trashRects}
          setRects={setTrashRects}
          containerRef={stageRef}
          storageKey={LR_TRASH_RECTS_KEY}
          scale={scale}
        />

        {/* Banner kecil: info mode overlay saat debug */}
        {debug && (
          <div
            style={{
              position: "absolute",
              right: 12,
              top: 12,
              background: "rgba(20,20,24,0.82)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 8,
              padding: "6px 10px",
              font: "600 12px/1.2 ui-sans-serif, system-ui",
              zIndex: 70,
            }}
          >
            Overlay: <b>{editMode === "world" ? "World (obstacles)" : "Trash (penempatan)"}</b>{" "}
            <span style={{ opacity: 0.8 }}>— tekan <b>T</b> untuk ganti</span>
          </div>
        )}
      </div>
    </div>
  );
}
