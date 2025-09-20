// src/mechanics/interact.js
import { useEffect, useRef, useState } from "react";

/** Rect helper biar konsisten. */
export function makeRect(x, y, w, h) {
  return { x, y, w, h };
}

/** AABB overlap (axis-aligned) */
export function overlaps(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Hook tombol interaksi satu-kali-per-tekan dengan debounce.
 * Return: { pressed } → true hanya 1 frame setelah ditekan.
 * Default key: 'KeyE'
 */
export function useInteractKey(code = "KeyE", debounceMs = 180) {
  const [pressed, setPressed] = useState(false);
  const lastTimeRef = useRef(0);
  const lockRef = useRef(false);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code !== code) return;
      const now = performance.now();
      if (now - lastTimeRef.current < debounceMs) return; // debounce

      // kunci agar 1x per tekan
      if (lockRef.current) return;
      lockRef.current = true;
      lastTimeRef.current = now;

      // set true sebentar (1 animation frame) lalu auto reset
      setPressed(true);
      requestAnimationFrame(() => {
        setPressed(false);
        // biar bisa ditekan lagi setelah user lepas tombol
        // kita tunggu keyup untuk buka lock
      });
    }

    function onKeyUp(e) {
      if (e.code !== code) return;
      // rilis lock saat tombol dilepas
      lockRef.current = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [code, debounceMs]);

  return { pressed };
}

/**
 * (Opsional) Hook buat deteksi tombol lagi di-HOLD.
 * Return: { holding } → true selama tombol ditekan terus.
 */
export function useKeyHold(code = "KeyE") {
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    const down = (e) => e.code === code && setHolding(true);
    const up = (e) => e.code === code && setHolding(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [code]);

  return { holding };
}
