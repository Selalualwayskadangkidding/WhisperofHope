// src/scenes/LivingRoomScene.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import DebugCollisionOverlay from "../mechanics/DebugCollisionOverlay.jsx";
import { moveWithCollisionAxis } from "../mechanics/collision.js";
import DoorHint from "../components/DoorHint.jsx";
import { overlaps as doorOverlaps } from "../mechanics/doors.js";
import {
  LR_STORAGE_KEY,
  getDefaultLivingroomObstacles,
} from "../data/livingroomObstacles.js";
import "../styles/livingroom.css";

// ===== Mekanik bersih-bersih =====
import {
  loadLivingroomTrash,
  markTrashClean,
  getNewlyUnlockedItems,
  computeProgress,
} from "../data/livingroomTrash.js";
import { useInteractKey } from "../mechanics/interact.js";

// ===== UI =====
import InteractHint from "../components/InteractHint.jsx";
import TrashSprite from "../components/TrashSprite.jsx";
import CleanlinessHUD from "../components/CleanlinessHUD.jsx";
import "../styles/cleaning.css";

// ===== Mini-game scrub (gerak mouse) =====
import useScrubStart from "../minigames/useScrubStart.jsx";

// ===== Editor penempatan trash rects =====
import {
  LR_TRASH_RECTS_KEY,
  getDefaultLivingroomTrashRects,
} from "../data/livingroomTrashRects.js";

/** ===== Konstanta Map & Player ===== */
const MAP_W = 1280;
const MAP_H = 720;

const SPRITE_W = 128;
const SPRITE_H = 128;

// hitbox “kaki”
const HITBOX = { offsetX: SPRITE_W / 2 - 10, offsetY: SPRITE_H - 22, w: 20, h: 14 };
const SPEED = 180;
const STAGE_ZOOM = 1.35;
const INTERACT_RADIUS = 52;

// Helper
const asRect = (o) => (o ? { x: o.x, y: o.y, width: o.w, height: o.h } : null);
const inflateRect = (r, m = 8) =>
  r ? { x: r.x - m, y: r.y - m, width: r.width + m * 2, height: r.height + m * 2 } : null;

export default function LivingRoomScene({
  onExitToHallway,
  onExitToYard,
  spawnTag = "from_yard", // "from_yard" | "from_hallway"
}) {
  const [scale] = useState(STAGE_ZOOM);

  // ======= DEBUG / OVERLAY =======
  const [debug, setDebug] = useState(false);
  const stageRef = useRef(null);

  // ======= OBSTACLES =======
  const [obstacles, setObstacles] = useState(getDefaultLivingroomObstacles());

  // ======= TRASH-RECT EDITOR =======
  const [trashRects, setTrashRects] = useState(getDefaultLivingroomTrashRects());
  const [editMode, setEditMode] = useState("world"); // "world" | "trash"

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

  // ======= CLEANING STATE (satu-satunya!) =======
  const [trashList, setTrashList] = useState(() => loadLivingroomTrash());
  const [focusId, setFocusId] = useState(null);
  const [focusPoint, setFocusPoint] = useState(null); // posisi hint
  const [progress, setProgress] = useState(0);
  const [checklist, setChecklist] = useState({});
  const interact = useInteractKey("KeyE", 180);
  const [hudCollapsed, setHudCollapsed] = useState(false);

  // lock input saat scrub overlay aktif
  const [isScrubbing, setIsScrubbing] = useState(false);

  // ======= Scrub mini-game hook & portal =======
  const { startScrub, ScrubPortal } = useScrubStart();

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

  // ======= INPUT =======
  useEffect(() => {
    const down = (e) => {
      if (e.key === "Shift") { setDebug(true); return; }
      if (e.key === "Tab") { e.preventDefault(); setHudCollapsed(c => !c); return; }

      if (e.key.toLowerCase() === "r" && debug) {
        localStorage.removeItem(LR_STORAGE_KEY);
        localStorage.removeItem(LR_TRASH_RECTS_KEY);
        setObstacles(getDefaultLivingroomObstacles());
        setTrashRects(getDefaultLivingroomTrashRects());
        return;
      }
      if (e.key.toLowerCase() === "t" && debug) {
        setEditMode(m => (m === "world" ? "trash" : "world"));
        return;
      }
      keys.current[e.key.toLowerCase()] = true;
    };
    const up = (e) => {
      if (e.key === "Shift") { setDebug(false); return; }
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
    const spawn =
      obstacles.find((o) => o.type === "spawn" && o.tag === spawnTag) ||
      obstacles.find((o) => o.type === "spawn");
    if (!spawn) return;
    const sx = spawn.x + (spawn.w - HITBOX.w) / 2 - HITBOX.offsetX;
    const sy = spawn.y + (spawn.h - HITBOX.h) / 2 - HITBOX.offsetY;
    posRef.current = { x: sx, y: sy };
    if (spriteRef.current) {
      spriteRef.current.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
    }
  }, [obstacles, spawnTag]);

  // ======= Ambil rect pintu dari obstacles (memo) =======
  const doorToYard = useMemo(
    () => asRect(obstacles.find(o => o.type === "door" && o.tag === "to_yard")),
    [obstacles]
  );
  const doorToHall = useMemo(
    () => asRect(obstacles.find(o => o.type === "door" && o.tag === "to_hallway")),
    [obstacles]
  );

  // ======= GAME LOOP =======
  useEffect(() => {
    let raf;
    let last = performance.now();

    // solids: JANGAN masukkan spawn/door
    const solids = obstacles.filter((o) => o.type !== "spawn" && o.type !== "door");

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      // Arah input (dibekukan kalau scrubbing)
      let ax = 0, ay = 0;
      const k = keys.current;
      if (!isScrubbing) {
        if (k["w"] || k["arrowup"])    { ay -= 1; setDirection("up"); }
        if (k["s"] || k["arrowdown"])  { ay += 1; setDirection("down"); }
        if (k["a"] || k["arrowleft"])  { ax -= 1; setDirection("left"); }
        if (k["d"] || k["arrowright"]) { ax += 1; setDirection("right"); }
      }

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
      const movedBox = { x: moved.x, y: moved.y, w: moved.w, h: moved.h };
      const yardRect = inflateRect(doorToYard, 6);
      const hallRect = inflateRect(doorToHall, 6);

      setNearYard(yardRect ? doorOverlaps(movedBox, yardRect) : false);
      setNearHall(hallRect ? doorOverlaps(movedBox, hallRect) : false);

      // Toggle anim
      const movingNow = len > 0;
      if (movingRef.current !== movingNow) {
        movingRef.current = movingNow;
        setToggleAnimFlag((f) => !f);
      }

      // ======= CLEANING: fokus item terdekat (pakai jarak, bukan overlap) =======
      const pCx = moved.x + moved.w / 2;
      const pCy = moved.y + moved.h / 2;

      let nearest = null;
      let nearestDist2 = Infinity;

      for (const it of trashList) {
        const cx = it.x + it.w / 2;
        const cy = it.y + it.h / 2;
        const dx2 = pCx - cx;
        const dy2 = pCy - cy;
        const d2 = dx2 * dx2 + dy2 * dy2;
        if (d2 < nearestDist2 && d2 <= INTERACT_RADIUS * INTERACT_RADIUS) {
          nearestDist2 = d2;
          nearest = it;
        }
      }

      setFocusId(nearest ? nearest.id : null);
      setFocusPoint(nearest ? { x: nearest.x + nearest.w / 2, y: nearest.y - 6 } : null);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [obstacles, doorToYard, doorToHall, progress, trashList.length, isScrubbing]);

  // ======= Tekan 'E' saat dekat salah satu pintu =======
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() !== "e" || isScrubbing) return;

      const curr = posRef.current;
      const hbNow = {
        x: curr.x + HITBOX.offsetX,
        y: curr.y + HITBOX.offsetY,
        w: HITBOX.w,
        h: HITBOX.h,
      };

      const yardRect = inflateRect(doorToYard, 6);
      const hallRect = inflateRect(doorToHall, 6);

      const inYard = yardRect ? doorOverlaps(hbNow, yardRect) : false;
      const inHall = hallRect ? doorOverlaps(hbNow, hallRect) : false;

      if (inHall && progress >= 70) {
        onExitToHallway?.();
      } else if (inYard) {
        onExitToYard?.();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doorToYard, doorToHall, progress, onExitToHallway, onExitToYard, isScrubbing]);

  // ======= CLEANING: tekan E (radius check) =======
  useEffect(() => {
    if (!interact.pressed || isScrubbing) return;

    const curr = posRef.current;
    const pCx = curr.x + HITBOX.offsetX + HITBOX.w / 2;
    const pCy = curr.y + HITBOX.offsetY + HITBOX.h / 2;

    let best = null, bestD2 = Infinity;
    for (const it of trashList) {
      const cx = it.x + it.w / 2;
      const cy = it.y + it.h / 2;
      const dx = pCx - cx, dy = pCy - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2 && d2 <= INTERACT_RADIUS * INTERACT_RADIUS) {
        bestD2 = d2; best = it;
      }
    }
    if (!best) return;

    if (best.type === "stain") {
      cleanWithScrub(best);
    } else {
      performClean(best);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interact.pressed, isScrubbing]);

  // ======= AKSI BERSIH (mini-game + update progress) =======
  async function cleanWithScrub(item) {
    setIsScrubbing(true); // freeze gerak + input lain
    const label =
      item.type === "cobweb"
        ? "Gerakkan mouse untuk membersihkan sarang laba-laba"
        : "Gerakkan mouse untuk mengelap";
    const required = item.type === "cobweb" ? 2600 : 2200;
    const ok = await startScrub({ label, required });
    setIsScrubbing(false);
    if (ok) performClean(item);
  }

  function performClean(item) {
    markTrashClean(item.id);
    setTrashList((prev) => prev.filter((t) => t.id !== item.id));

    const unlocked = getNewlyUnlockedItems(item.id);
    if (unlocked.length) setTrashList((prev) => [...prev, ...unlocked]);

    const { percent, checklist: cl } = computeProgress();
    setProgress(percent);
    setChecklist(cl);
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

        {/* SPRITE SAMPAH */}
        {trashList.map((it) => (
          <TrashSprite
            key={it.id}
            x={it.x}
            y={it.y}
            w={it.w}
            h={it.h}
            sprite={it.sprite}
            alt={it.label}
            z={2}
          />
        ))}

        {/* Door hints (muncul HANYA saat dekat) */}
        {doorToYard && (
          <DoorHint
            show={nearYard}
            x={doorToYard.x + doorToYard.width / 2}
            y={doorToYard.y - 6}
            text="Tekan E untuk ke Yard"
          />
        )}
        {doorToHall && (
          <DoorHint
            show={progress >= 70 && nearHall}
            x={doorToHall.x + doorToHall.width / 2}
            y={doorToHall.y - 6}
            text={progress >= 70 ? "Tekan E untuk ke Hallway" : "Bersihkan ≥ 70% untuk buka pintu"}
          />
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
            zIndex: 3,
            position: "absolute",
          }}
          draggable={false}
        />

        {/* HINT INTERAKSI SAMPAH */}
        {(() => {
          const target = trashList.find((t) => t.id === focusId);
          if (!target || !focusPoint) return null;
          const label =
            target.type === "stain"
              ? "Tekan E untuk MULAI mengelap"
              : `Tekan E — ${target.label}`;
          return <InteractHint visible x={focusPoint.x} y={focusPoint.y - 10} text={label} />;
        })()}

        {/* HUD Kebersihan */}
        <CleanlinessHUD
          progress={progress}
          checklist={checklist}
          collapsed={hudCollapsed}
          onToggle={() => setHudCollapsed((v) => !v)}
        />

        {/* ===== OVERLAYS (tahan SHIFT) ===== */}
        <DebugCollisionOverlay
          active={debug && editMode === "world"}
          rects={obstacles}
          setRects={setObstacles}
          containerRef={stageRef}
          storageKey={LR_STORAGE_KEY}
          scale={scale}
        />
        <DebugCollisionOverlay
          active={debug && editMode === "trash"}
          rects={trashRects}
          setRects={setTrashRects}
          containerRef={stageRef}
          storageKey={LR_TRASH_RECTS_KEY}
          scale={scale}
        />
      </div>

      {/* Portal overlay untuk mini-game scrub */}
      {ScrubPortal}
    </div>
  );
}
