// src/scenes/MarketScene.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import DebugCollisionOverlay from "../mechanics/DebugCollisionOverlay.jsx";
import { moveWithCollisionAxis } from "../mechanics/collision.js";
import useDoorEnter from "../mechanics/useDoorEnter.js";
import { overlaps } from "../mechanics/doors.js";
import DoorHint from "../components/DoorHint.jsx";
import TalkPanel from "../components/TalkPanel.jsx";

import InventoryPanel from "../components/InventoryPanel.jsx";
import { merchantAPI, listAllItems } from "../state/inventory.js";
import { useMoney } from "../state/money.js";

import MerchantShop from "../merchant/MerchantShop.jsx";
import { getIsFirstTime, markSeen } from "../merchant/useMerchantFlags.js";
import "../merchant/styles/merchant.css";
import MoneyText from "../components/MoneyText.jsx";

const BASE = import.meta.env.BASE_URL || "/";
const MAP_W = 1280;
const MAP_H = 720;

/* ==================== PLAYER CONFIG ==================== */
const SPRITE_BASE = { w: 150, h: 150, offX: 65, offY: 135 };
const DESIRED_SPRITE_W = 250;
const P_SCALE = DESIRED_SPRITE_W / SPRITE_BASE.w;
const P_W = Math.round(SPRITE_BASE.w * P_SCALE);
const P_H = Math.round(SPRITE_BASE.h * P_SCALE);
const P_HITBOX = {
  w: 20,
  h: 15,
  offsetX: Math.round(SPRITE_BASE.offX * P_SCALE),
  offsetY: Math.round(SPRITE_BASE.offY * P_SCALE),
};

/* ==================== NPC CONFIG ==================== */
const NPC_BASE = { w: 150, h: 150, offX: 65, offY: 135 };
const NPC_DESIRED_W = 340;
const NPC_SCALE = NPC_DESIRED_W / NPC_BASE.w;
const NPC_W = Math.round(NPC_BASE.w * NPC_SCALE);
const NPC_H = Math.round(NPC_BASE.h * NPC_SCALE);
const NPC_HITBOX = {
  w: 20,
  h: 15,
  offsetX: Math.round(NPC_BASE.offX * NPC_SCALE),
  offsetY: Math.round(NPC_BASE.offY * NPC_SCALE),
};
const NPC_OFFSET = { x: 0, y: -60 };
const NPC_ROTATE_DEG = -90; // hadap kanan

/* ==================== WORLD CONFIG ==================== */
const SPEED = 180;
const COLLISION_ENABLED = true;
const SHOW_COLLISION_VISUAL = false;
const SHOW_DOOR_DEBUG_BOX = false;
const SHOW_HINT_DEBUG_TEXT = false;

const MARKET_STORAGE_KEY = "hv_collision_rects_market_v1";

/* ==================== OBSTACLES ==================== */
function getDefaultMarketObstacles() {
  return [
    { id: 1, x: 0, y: 0, w: 2534, h: 18, type: "solid" },
    { id: 2, x: 7, y: 1165, w: 2525, h: 31, type: "solid" },
    { id: 3, x: 0, y: 0, w: 6, h: 1196, type: "solid" },
    { id: 4, x: 2513, y: -8, w: 35, h: 1199, type: "solid" },
    { id: 5, x: 1621, y: 3, w: 184, h: 203, type: "solid" },
    { id: 6, x: 1576, y: 958, w: 212, h: 209, type: "solid" },
    { id: 7, x: 1581, y: 573, w: 230, h: 176, type: "solid" },
    { id: 8, x: 1541, y: 197, w: 244, h: 251, type: "solid" },
    { id: 9, x: 1801, y: 9, w: 633, h: 460, type: "solid" },
    { id: 10, x: 1782, y: 515, w: 703, h: 652, type: "solid" },
    { id: 11, x: 1564, y: 760, w: 237, h: 187, type: "solid" },

    // area NPC (buat spawn pedagang)
    { id: 12, x: 34, y: 635, w: 476, h: 508, type: "spawnNPC" },

    // spawn pemain ke map ini (juga jadi zona keluar)
    { id: 200, x: 580, y: 660, w: 120, h: 40, type: "spawn" },

    // sampah (rects)
    { id: 301, x: 260, y: 420, w: 28, h: 22, type: "trash", label: "kardus" },
    { id: 302, x: 520, y: 460, w: 24, h: 20, type: "trash", label: "plastik" },
    { id: 303, x: 900, y: 430, w: 32, h: 24, type: "trash", label: "daun kering" },
    { id: 304, x: 1040, y: 520, w: 26, h: 20, type: "trash", label: "kertas" },
  ];
}

function loadMarketObstaclesFromStorage() {
  try {
    const raw = localStorage.getItem(MARKET_STORAGE_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

function rectToOverlapBox(r) {
  const width = r.w ?? r.width ?? 0;
  const height = r.h ?? r.height ?? 0;
  return { x: r.x, y: r.y, width, height };
}

/* ==================== SCENE ==================== */
export default function MarketScene({ onBack }) {
  const worldRef = useRef(null);
  const spriteRef = useRef(null);

  const [debugEdit, setDebugEdit] = useState(false);
  const [direction, setDirection] = useState("down");
  const [step, setStep] = useState(1);
  const [toggleAnim, setToggleAnim] = useState(false);
  const movingRef = useRef(false);
  const keysPressed = useRef({});

  const [obstacles, setObstacles] = useState(
    () => loadMarketObstaclesFromStorage() ?? getDefaultMarketObstacles()
  );

  // === NPC spawn (Pak Eka) ===
  const npcSpawnRect = useMemo(
    () => obstacles.find((o) => o.type === "spawnNPC") || null,
    [obstacles]
  );
  const [npcs, setNpcs] = useState(() => [
    {
      id: "pak-eka",
      name: "Pak Eka",
      x: 80,
      y: 700,
      sprite: `${BASE}assets/characters/npc/mainMerchant.png`,
    },
  ]);
  useEffect(() => {
    if (!npcSpawnRect) return;
    setNpcs((prev) =>
      prev.map((n) => ({
        ...n,
        x:
          npcSpawnRect.x -
          NPC_HITBOX.offsetX +
          (npcSpawnRect.w - NPC_HITBOX.w) / 2 +
          NPC_OFFSET.x,
        y:
          npcSpawnRect.y -
          NPC_HITBOX.offsetY +
          (npcSpawnRect.h - NPC_HITBOX.h) / 2 +
          NPC_OFFSET.y,
      }))
    );
  }, [npcSpawnRect]);

  // === Persist rect edit
  useEffect(() => {
    try {
      localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(obstacles));
    } catch {}
  }, [obstacles]);

  const posRef = useRef({ x: MAP_W / 2, y: MAP_H / 2 });

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

  const marketExitZone = useMemo(
    () => obstacles.find((o) => o.type === "spawn" && o.id === 200) || null,
    [obstacles]
  );
  const [nearExit, setNearExit] = useState(false);

  // === Interaksi NPC & toko
  const [nearNpcId, setNearNpcId] = useState(null);
  const [talkOpen, setTalkOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [firstTime, setFirstTime] = useState(() => getIsFirstTime());

  // === UANG (global)
  const { money, setMoney } = useMoney();

  // === INVENTORY gabungan (tools + consumables)
  const [inventory, setInventory] = useState(() => listAllItems());
  const [showInventory, setShowInventory] = useState(false);

  /* ==================== KEYBOARD ==================== */
  useEffect(() => {
    const onDown = (e) => {
      if (e.key === "Shift") {
        setDebugEdit(true);
        return;
      }
      // Toggle Inventory manual
      if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        setShowInventory((v) => !v);
        return;
      }
      // Interaksi E dengan NPC
      if ((e.key === "e" || e.key === "E") && nearNpcId && !talkOpen && !shopOpen) {
        if (getIsFirstTime()) {
          setTalkOpen(true);
        } else {
          setShopOpen(true);
        }
        return;
      }
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const onUp = (e) => {
      if (e.key === "Shift") {
        setDebugEdit(false);
        return;
      }
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [nearNpcId, talkOpen, shopOpen]);

  /* ==================== GAME LOOP ==================== */
  useEffect(() => {
    let raf;
    let last = performance.now();

    // gabung solid obstacles + NPC (biar NPC bisa ditabrak)
    const npcSolids = npcs.map((n) => ({
      x: Math.round(n.x + NPC_HITBOX.offsetX),
      y: Math.round(n.y + NPC_HITBOX.offsetY),
      w: NPC_HITBOX.w,
      h: NPC_HITBOX.h,
      type: "solid",
    }));
    const solids = obstacles.filter((o) => o.type === "solid").concat(npcSolids);

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      let ax = 0,
        ay = 0;
      if (keysPressed.current["w"] || keysPressed.current["arrowup"]) {
        ay -= 1;
        setDirection("up");
      }
      if (keysPressed.current["s"] || keysPressed.current["arrowdown"]) {
        ay += 1;
        setDirection("down");
      }
      if (keysPressed.current["a"] || keysPressed.current["arrowleft"]) {
        ax -= 1;
        setDirection("left");
      }
      if (keysPressed.current["d"] || keysPressed.current["arrowright"]) {
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
        x: curr.x + P_HITBOX.offsetX,
        y: curr.y + P_HITBOX.offsetY,
        w: P_HITBOX.w,
        h: P_HITBOX.h,
      };

      const moved =
        COLLISION_ENABLED && (dx || dy)
          ? moveWithCollisionAxis(hb, dx, dy, solids)
          : { ...hb, x: hb.x + dx, y: hb.y + dy };

      const next = {
        x: moved.x - P_HITBOX.offsetX,
        y: moved.y - P_HITBOX.offsetY,
      };

      if (next.x !== curr.x || next.y !== curr.y) {
        posRef.current = next;
        if (spriteRef.current) {
          spriteRef.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
        }
      }

      // anim jalan
      const isMoving = len > 0;
      if (movingRef.current !== isMoving) {
        movingRef.current = isMoving;
        setToggleAnim((f) => !f);
      }

      // proximity ke zona exit (id 200)
      if (marketExitZone) {
        const movedBox = { x: moved.x, y: moved.y, width: moved.w, height: moved.h };
        setNearExit(overlaps(movedBox, rectToOverlapBox(marketExitZone)));
      } else {
        setNearExit(false);
      }

      // proximity ke NPC (pakai box hitbox NPC yang dilebarkan dikit)
      let found = null;
      for (const n of npcs) {
        const nb = {
          x: n.x + NPC_HITBOX.offsetX - 12,
          y: n.y + NPC_HITBOX.offsetY - 12,
          width: NPC_HITBOX.w + 24,
          height: NPC_HITBOX.h + 24,
        };
        if (overlaps({ x: moved.x, y: moved.y, width: moved.w, height: moved.h }, nb)) {
          found = n.id;
          break;
        }
      }
      setNearNpcId(found);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [obstacles, marketExitZone, npcs]);

  // === Anim step
  useEffect(() => {
    let id;
    if (movingRef.current) id = setInterval(() => setStep((p) => (p === 1 ? 2 : 1)), 130);
    else setStep(1);
    return () => clearInterval(id);
  }, [toggleAnim]);

  // === SPAWN AWAL → PASTI DI ID 200
  useEffect(() => {
    const spawn = obstacles.find((o) => o.type === "spawn" && o.id === 200);
    const fallback = { x: MAP_W / 2 - P_HITBOX.offsetX, y: MAP_H / 2 - P_HITBOX.offsetY };

    const sx = spawn ? spawn.x - P_HITBOX.offsetX + (spawn.w - P_HITBOX.w) / 2 : fallback.x;
    const sy = spawn ? spawn.y - P_HITBOX.offsetY + (spawn.h - P_HITBOX.h) / 2 : fallback.y;

    posRef.current = { x: sx, y: sy };
    if (spriteRef.current) {
      spriteRef.current.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
    }
  }, [obstacles]);

  // === E untuk balik ke Yard
  useDoorEnter({
    enabled: !!nearExit,
    onEnter: () => onBack?.(),
  });

  const trashRects = useMemo(
    () => obstacles.filter((o) => o.type === "trash"),
    [obstacles]
  );

  /* ==================== RENDER ==================== */
  return (
    <div
      ref={worldRef}
      style={{
        width: "100vw",
        height: "100vh",
        backgroundImage: `url(${BASE}assets/maps/pasar.jpg)`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* HUD Uang (seragam sama scene lain) */}
      <MoneyText
        prefix=""
        style={{
          position: "absolute",
          left: 12,
          top: 12,
          zIndex: 12,
          fontWeight: 800,
          color: "#fff",
          textShadow: "0 2px 0 #0008",
        }}
      />

      {/* DEBUG rects */}
      {SHOW_COLLISION_VISUAL &&
        obstacles.map((o) => (
          <div
            key={`${o.id}-${o.x}-${o.y}`}
            style={{
              position: "absolute",
              left: o.x,
              top: o.y,
              width: o.w,
              height: o.h,
              background:
                o.type === "solid"
                  ? "rgba(255,0,0,0.25)"
                  : o.type === "spawn"
                  ? "rgba(0,128,255,0.22)"
                  : "rgba(255,200,0,0.22)",
              border:
                o.type === "solid"
                  ? "1px solid #ff4444"
                  : o.type === "spawn"
                  ? "1px dashed #3aa0ff"
                  : "1px dashed #ffcc33",
              zIndex: 8,
              pointerEvents: "none",
            }}
          />
        ))}

      {/* Zona exit (debug) */}
      {SHOW_DOOR_DEBUG_BOX && marketExitZone && (
        <div
          style={{
            position: "absolute",
            left: marketExitZone.x,
            top: marketExitZone.y,
            width: marketExitZone.w,
            height: marketExitZone.h,
            border: "2px dashed #00ff88",
            background: "rgba(0,255,136,0.12)",
            pointerEvents: "none",
            zIndex: 7,
          }}
        />
      )}

      {/* Hint E untuk exit */}
      {marketExitZone && (
        <DoorHint
          show={nearExit}
          x={marketExitZone.x + marketExitZone.w / 2}
          y={marketExitZone.y - 6}
          text="Tekan E untuk kembali ke Yard"
        />
      )}

      {/* ===== NPC Pak Eka + hint ngobrol ===== */}
      {npcs.map((n) => (
        <img
          key={n.id}
          src={n.sprite}
          alt={n.name}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: NPC_W,
            height: NPC_H,
            transform: `translate3d(${n.x}px, ${n.y}px, 0) rotate(${NPC_ROTATE_DEG}deg)`,
            transformOrigin: "50% 100%", // pivot di kaki
            imageRendering: "pixelated",
            pointerEvents: "none",
            zIndex: 9,
          }}
        />
      ))}

      {npcs.map((n) => {
        const show = nearNpcId === n.id && !talkOpen && !shopOpen;
        return (
          <DoorHint
            key={`${n.id}-hint`}
            show={show}
            x={n.x + NPC_W / 2}
            y={n.y - 8}
            text="Tekan E untuk ngobrol"
          />
        );
      })}

      {/* Sampah (dummy indikator) */}
      {trashRects.map((t) => (
        <div
          key={t.id}
          title={t.label || "sampah"}
          style={{
            position: "absolute",
            left: t.x,
            top: t.y,
            width: t.w,
            height: t.h,
            background: "rgba(255, 210, 50, 0.35)",
            border: "1px solid rgba(255, 210, 50, 0.9)",
            borderRadius: 4,
            zIndex: 6,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Player */}
      <img
        ref={spriteRef}
        src={`${BASE}assets/characters/${getCharacterSprite(direction, step)}`}
        alt="player"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: P_W,
          height: P_H,
          transform: "translate3d(0,0,0)",
          willChange: "transform",
          imageRendering: "pixelated",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* Editor collision (SHIFT) */}
      <DebugCollisionOverlay
        active={debugEdit}
        rects={obstacles}
        setRects={setObstacles}
        containerRef={worldRef}
        storageKey={MARKET_STORAGE_KEY}
      />

      {/* Dialog first-time Pak Eka */}
      <TalkPanel
        open={talkOpen}
        name="Pak Eka"
        text={
          firstTime
            ? "Warga baru ya, mas? Selamat datang di Harapan Village. Kalau butuh alat atau cemilan, belanja di sini aja."
            : "Mau belanja apa hari ini?"
        }
        onClose={() => {
          setTalkOpen(false);
          if (firstTime) {
            markSeen();
            setFirstTime(false);
            setTimeout(() => setShopOpen(true), 150);
          }
        }}
      />

      {/* Toko Pak Eka */}
      <MerchantShop
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        money={money}
        setMoney={setMoney}
        hasItem={merchantAPI.hasItem}
        addItem={(id) => {
          const ok = merchantAPI.addItem(id);
          // refresh inventori gabungan agar panel 'I' langsung kebaca item baru
          setInventory(listAllItems());
          return ok;
        }}
      />

      {/* Tombol back (fallback) */}
      <button
        onClick={() => onBack?.()}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #333",
          background: "#fff",
          cursor: "pointer",
          zIndex: 11,
        }}
      >
        ← Kembali ke Yard (atau E di zona bawah)
      </button>

      {/* Inventory Panel (toggle dengan tombol I) */}
      {showInventory && (
        <InventoryPanel
          items={inventory}
          onClose={() => setShowInventory(false)}
          disableBackdropClose={false}
          hideCloseButton={false}
          onItemClick={() => {}}
        />
      )}

      {SHOW_HINT_DEBUG_TEXT && (
        <div
          style={{
            position: "absolute",
            right: 8,
            top: 8,
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            padding: "6px 8px",
            borderRadius: 8,
            fontSize: 12,
            zIndex: 9999,
          }}
        >
          nearExit: {String(nearExit)} | nearNpc: {String(nearNpcId)} | first:
          {String(firstTime)}
        </div>
      )}
    </div>
  );
}
