// src/scenes/YardScene.jsx
import { useEffect, useRef, useState } from "react";
import DebugCollisionOverlay from "../mechanics/DebugCollisionOverlay.jsx";
import { moveWithCollisionAxis } from "../mechanics/collision.js";
import {
  STORAGE_KEY,
  getDefaultObstacles,
  loadObstaclesFromStorage,
} from "../data/yardObstacles.js";
import { overlaps } from "../mechanics/doors.js";
import useDoorEnter from "../mechanics/useDoorEnter.js";
import DoorHint from "../components/DoorHint.jsx";

import InventoryPanel from "../components/InventoryPanel.jsx";
import KeyPickerModal from "../components/KeyPickerModal.jsx";
import { itemLabel } from "../state/itemsDb.js";

import {
  loadInventory,
  saveInventory,
  hasItem,
  addItem,
  ITEMS,
  listKeysForHouse,
  hasMatchingKey,
  // removeItem, // aktifkan jika kunci sekali pakai
} from "../state/inventory.js";

import { isLocked, setLocked, ensureLock } from "../state/locks.js";

/** ==== KONFIG ==== */
const COLLISION_ENABLED = true;
const SHOW_COLLISION_VISUAL = false;
const SHOW_DOOR_DEBUG_BOX = false;
const SHOW_HINT_DEBUG_TEXT = false;

const HITBOX = { offsetX: 65, offsetY: 135, w: 20, h: 15 };
const SPEED = 180;

/** Door di obstacle (ambil bibir bawah dari obstacle id ini) */
const HOUSE_RECT_ID_FOR_DOOR = 7;

/** Tag rumah & ID pintu depan untuk lock per pintu */
const HOUSE_TAG = "house1";
const FRONT_LOCK_ID = "frontdoor";

export default function YardScene({ onEnterHouse }) {
  const worldRef = useRef(null);
  const [debug, setDebug] = useState(false);

  /** Obstacles */
  const [obstacles, setObstacles] = useState(() =>
    loadObstaclesFromStorage(STORAGE_KEY) ?? getDefaultObstacles()
  );

  /** Door zone + proximity */
  const [doorZone, setDoorZone] = useState(null); // {x,y,width,height}
  const [nearDoor, setNearDoor] = useState(false);

  /** Player */
  const spriteRef = useRef(null);
  const posRef = useRef({ x: 300, y: 300 });
  const keysPressed = useRef({});
  const movingRef = useRef(false);

  const [direction, setDirection] = useState("down");
  const [step, setStep] = useState(1);
  const [toggleAnimFlag, setToggleAnimFlag] = useState(false);

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

  /** Inventori */
  const [inventory, setInventory] = useState(() => loadInventory());
  const [showInventory, setShowInventory] = useState(false);

  /** Lock pintu ini (persist per pintu) */
  const [locked, setLockedState] = useState(() =>
    isLocked(HOUSE_TAG, FRONT_LOCK_ID)
  );
  const [showKeyPicker, setShowKeyPicker] = useState(false);

  /** Seed inventori (sekali jalan) + pastikan lock ada */
  useEffect(() => {
    // pastikan lock punya default (locked)
    ensureLock(HOUSE_TAG, FRONT_LOCK_ID, true);

    // seed contoh item
    const inv = loadInventory();
    let next = inv.slice();
    let changed = false;

    if (!hasItem(next, ITEMS.HOUSE_KEYRING)) {
      next = addItem(next, ITEMS.HOUSE_KEYRING);
      changed = true;
    }
    const keyFront = `key:${HOUSE_TAG}:${FRONT_LOCK_ID}`;
    if (!hasItem(next, keyFront)) {
      next = addItem(next, keyFront);
      changed = true;
    }
    if (changed) {
      saveInventory(next);
      setInventory(next);
    }

    // sinkron ulang state lock dari storage
    setLockedState(isLocked(HOUSE_TAG, FRONT_LOCK_ID));
  }, []);

  /** Hitung zona pintu dari obstacle rumah */
  useEffect(() => {
    const house = obstacles.find((o) => o.id === HOUSE_RECT_ID_FOR_DOOR);
    if (!house) {
      setDoorZone(null);
      return;
    }
    const width = 80;
    const height = 40;
    const x = house.x + (house.w - width) / 2;
    const y = house.y + house.h - height + 20; // sejajar tanah
    setDoorZone({ x, y, width, height });
  }, [obstacles]);

  /** Keyboard: WASD + I + E (gunakan kunci HANYA saat dekat pintu & terkunci) */
  useEffect(() => {
    const onKeyDown = (e) => {
      // Toggle Inventory
      if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        setShowInventory((v) => !v);
        return;
      }

      // Gunakan kunci → hanya kalau dekat pintu & masih terkunci
      if (nearDoor && locked && (e.key === "e" || e.key === "E")) {
        e.preventDefault();

        // Kandidat kunci untuk rumah ini
        const candidates = listKeysForHouse(inventory, HOUSE_TAG);

        // Back-compat: jika masih pakai single ITEMS.HOUSE_KEY → anggap valid
        if (hasItem(inventory, ITEMS.HOUSE_KEY)) {
          setLocked(HOUSE_TAG, FRONT_LOCK_ID, false);
          setLockedState(false);
          console.log("Pintu terbuka (legacy HOUSE_KEY).");
          return;
        }

        if (candidates.length === 0) {
          console.log("Pintu terkunci. Tidak ada kunci untuk rumah ini.");
          return;
        }
        if (candidates.length === 1) {
          const only = candidates[0];
          if (hasMatchingKey(inventory, HOUSE_TAG, FRONT_LOCK_ID)) {
            setLocked(HOUSE_TAG, FRONT_LOCK_ID, false);
            setLockedState(false);
            console.log(`Membuka pintu dengan ${itemLabel(only)}.`);
            // setInventory(removeItem(inventory, only)); // kalau sekali pakai
          } else {
            console.log("Kunci itu tidak cocok untuk pintu ini.");
          }
          return;
        }
        setShowKeyPicker(true);
        return;
      }

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
  }, [nearDoor, locked, inventory]);

  /** E → masuk rumah hanya saat dekat pintu & sudah TIDAK terkunci */
  useDoorEnter({
    enabled: nearDoor && !locked,
    onEnter: onEnterHouse,
  });

  /** Loop game (gerak + collision + deteksi nearDoor) */
  useEffect(() => {
    let raf;
    let last = performance.now();
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
      if (len > 0) { dx = (ax / len) * SPEED * dt; dy = (ay / len) * SPEED * dt; }

      const curr = posRef.current;
      const hb = { x: curr.x + HITBOX.offsetX, y: curr.y + HITBOX.offsetY, w: HITBOX.w, h: HITBOX.h };

      let moved = hb;
      if (COLLISION_ENABLED && (dx || dy)) {
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

      // Deteksi dekat pintu
      if (doorZone) {
        const movedBox = { x: moved.x, y: moved.y, width: moved.w, height: moved.h };
        setNearDoor(!!overlaps(movedBox, doorZone));
      } else {
        setNearDoor(false);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [obstacles, doorZone]);

  /** Anim kaki */
  useEffect(() => {
    let id;
    if (movingRef.current) {
      id = setInterval(() => setStep((p) => (p === 1 ? 2 : 1)), 130);
    } else {
      setStep(1);
    }
    return () => clearInterval(id);
  }, [toggleAnimFlag]);

  /** Spawn awal */
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
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Collision visual */}
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
              background: "rgba(255,255,0,0.2)",
              border: "1px solid orange",
              pointerEvents: "none",
              zIndex: 8,
            }}
          />
        ))}

      {/* Zona pintu (debug) */}
      {SHOW_DOOR_DEBUG_BOX && doorZone && (
        <div
          style={{
            position: "absolute",
            left: doorZone.x,
            top: doorZone.y,
            width: doorZone.width,
            height: doorZone.height,
            border: "2px dashed #00ff88",
            background: "rgba(0,255,136,0.12)",
            pointerEvents: "none",
            zIndex: 7,
          }}
        />
      )}

      {/* Hint pintu */}
      {doorZone && (
        <DoorHint
          show={nearDoor}
          x={doorZone.x + doorZone.width / 2}
          y={doorZone.y - 6}
          text={locked ? "Tekan E untuk gunakan kunci" : "Tekan E untuk masuk"}
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

      {/* Modal pilih kunci (jika kandidat > 1) */}
      {showKeyPicker && (
        <KeyPickerModal
          keys={listKeysForHouse(inventory, HOUSE_TAG)}
          onCancel={() => setShowKeyPicker(false)}
          onPick={(id) => {
            if (id === `key:${HOUSE_TAG}:${FRONT_LOCK_ID}`) {
              setLocked(HOUSE_TAG, FRONT_LOCK_ID, false);
              setLockedState(false);
              console.log(`Membuka pintu dengan ${itemLabel(id)}.`);
              // setInventory(removeItem(inventory, id)); // kalau sekali pakai
            } else {
              console.log("Kunci tidak cocok.");
            }
            setShowKeyPicker(false);
          }}
        />
      )}

      {/* Inventory */}
      {showInventory && (
        <InventoryPanel items={inventory} onClose={() => setShowInventory(false)} />
      )}

      {/* Editor overlay (tahan SHIFT) */}
      <DebugCollisionOverlay
        active={debug}
        rects={obstacles}
        setRects={setObstacles}
        containerRef={worldRef}
        storageKey={STORAGE_KEY}
      />

      {/* Debug kecil */}
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
          nearDoor: {String(nearDoor)} | locked: {String(locked)}
        </div>
      )}
    </div>
  );
}
