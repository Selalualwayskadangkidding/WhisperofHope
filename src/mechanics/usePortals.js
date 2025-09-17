// src/mechanics/usePortals.js
import { useEffect, useMemo, useRef, useState } from "react";
import { PORTAL_DEFS } from "../data/portals";

function overlap(a, b) {
  return !(
    b.x > a.x + a.width ||
    b.x + b.width < a.x ||
    b.y > a.y + a.height ||
    b.y + b.height < a.y
  );
}

/**
 * usePortals(sceneName, getPlayerRect, onTravel)
 * - sceneName: string nama scene aktif
 * - getPlayerRect: function () => {x,y,width,height}
 * - onTravel: (toScene, toSpawn) => void
 */
export default function usePortals(sceneName, getPlayerRect, onTravel) {
  const [active, setActive] = useState(null);
  const candidates = useMemo(
    () => PORTAL_DEFS.filter((p) => p.fromScene === sceneName),
    [sceneName]
  );

  // cek overlap tiap frame
  useEffect(() => {
    let raf;
    const loop = () => {
      const rect = getPlayerRect();
      const hit = candidates.find((p) => overlap(p.area, rect));
      setActive(hit || null);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [candidates, getPlayerRect]);

  // tombol E untuk travel
  const keyHeld = useRef(false);
  useEffect(() => {
    const down = (e) => {
      if (e.key.toLowerCase() !== "e") return;
      keyHeld.current = true;
      if (active) onTravel(active.toScene, active.toSpawn);
    };
    const up = (e) => {
      if (e.key.toLowerCase() === "e") keyHeld.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [active, onTravel]);

  return { activePortal: active };
}
