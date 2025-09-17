import { useEffect, useRef, useState, useMemo } from "react";
import DebugCollisionOverlay from "../mechanics/DebugCollisionOverlay.jsx";
import { moveWithCollisionAxis } from "../mechanics/collision.js";
import useDoorEnter from "../mechanics/useDoorEnter.js";
import DoorHint from "../components/DoorHint.jsx";
import {
  BM_STORAGE_KEY,
  getDefaultBathroomObstacles,
  loadBathroomObstaclesFromStorage,
} from "../data/bathroomObstacles.js";
import "../styles/hallway.css";

const HITBOX = { offsetX: 65, offsetY: 135, w: 20, h: 15 };
const SPEED = 180;

// ID unik khusus pintu balik ke hallway
const DOOR_BACK_ID = 902;

// Overlap AABB konsisten
function rectOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export default function BathroomScene({
  onBackHallway,
  mapImageSrc = "/assets/maps/bathroom.jpg",
  playerImageSrc = "/assets/characters/backleft.png",
}) {
  const [obstacles, setObstacles] = useState(() =>
    loadBathroomObstaclesFromStorage() ?? getDefaultBathroomObstacles()
  );
  useEffect(() => {
    localStorage.setItem(BM_STORAGE_KEY, JSON.stringify(obstacles));
  }, [obstacles]);

  const worldRef = useRef(null);
  const spriteRef = useRef(null);
  const posRef = useRef({ x: 300, y: 300 });
  const keys = useRef({});

  // spawn awal
  useEffect(() => {
    const spawn =
      obstacles.find((o) => o.type === "spawn" && o.id === 100) ??
      obstacles.find((o) => o.type === "spawn");
    if (!spawn) return;
    const x = spawn.x - HITBOX.offsetX + (spawn.w - HITBOX.w) / 2;
    const y = spawn.y - HITBOX.offsetY + (spawn.h - HITBOX.h) / 2;
    posRef.current = { x, y };
    if (spriteRef.current)
      spriteRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, [obstacles]);

  useEffect(() => {
    const dn = (e) => (keys.current[e.key.toLowerCase()] = true);
    const up = (e) => (keys.current[e.key.toLowerCase()] = false);
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Ambil rect pintu (type: "door", id: DOOR_BACK_ID)
  const doorRect = useMemo(() => {
    const d = obstacles.find((o) => o.type === "door" && o.id === DOOR_BACK_ID);
    return d
      ? { x: d.x, y: d.y, width: d.w ?? d.width, height: d.h ?? d.height }
      : null;
  }, [obstacles]);

  const [near, setNear] = useState(false);

  useDoorEnter({
    enabled: near,
    onEnter: () => onBackHallway && onBackHallway(),
  });

  // game loop
  useEffect(() => {
    let raf, last = performance.now();

    // Exclude spawn & door dari collision
    const solids = obstacles.filter((o) => o.type !== "spawn" && o.type !== "door");

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      let ax = 0, ay = 0;
      if (keys.current["w"]) ay -= 1;
      if (keys.current["s"]) ay += 1;
      if (keys.current["a"]) ax -= 1;
      if (keys.current["d"]) ax += 1;

      const len = Math.hypot(ax, ay);
      const dx = len ? (ax / len) * SPEED * dt : 0;
      const dy = len ? (ay / len) * SPEED * dt : 0;

      const curr = posRef.current;
      const hb = {
        x: curr.x + HITBOX.offsetX,
        y: curr.y + HITBOX.offsetY,
        w: HITBOX.w,
        h: HITBOX.h,
      };
      const moved = moveWithCollisionAxis(hb, dx, dy, solids);
      const next = { x: moved.x - HITBOX.offsetX, y: moved.y - HITBOX.offsetY };
      posRef.current = next;
      if (spriteRef.current)
        spriteRef.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;

      // Cek dekat pintu (arah atas/bawah/kanan/kiri sama-sama valid)
      const playerBox = { x: moved.x, y: moved.y, width: moved.w, height: moved.h };
      setNear(!!doorRect && rectOverlap(playerBox, doorRect));

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [obstacles, doorRect]);

  return (
    <div className="hw-root">
      <div className="hw-stage" ref={worldRef}>
        <img src={mapImageSrc} alt="bathroom" className="hw-map pixelated" />
        <img
          ref={spriteRef}
          src={playerImageSrc}
          alt="player"
          className="hw-player pixelated"
          style={{ width:150, height:150 }}
        />
        {near && doorRect && (
          <DoorHint
            show
            x={doorRect.x + doorRect.width/2}
            y={doorRect.y - 6}
            text="Tekan E — Kembali ke Hallway"
          />
        )}
        <DebugCollisionOverlay
          active
          rects={obstacles}
          setRects={setObstacles}
          containerRef={worldRef}
          storageKey={BM_STORAGE_KEY}
        />
      </div>
    </div>
  );
}
