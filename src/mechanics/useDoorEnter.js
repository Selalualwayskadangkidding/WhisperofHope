// src/mechanics/useDoorEnter.js
import { useEffect, useRef } from "react";

/**
 * Listener tombol 'E' dengan cooldown + initial debounce.
 *
 * Props:
 * - enabled: boolean (true kalau player lagi di zona pintu/objek)
 * - onEnter: function() => dipanggil saat E ditekan dan enabled = true
 * - keyName: default 'e'
 * - cooldownMs: cegah spam trigger (default 400ms)
 * - initialDebounceMs: tunda penerimaan input setelah mount (default 250ms)
 *   → mencegah kasus "E masih kepencet" saat pindah scene.
 */
export default function useDoorEnter({
  enabled,
  onEnter,
  keyName = "e",
  cooldownMs = 400,
  initialDebounceMs = 250,
}) {
  const lastRef = useRef(0);
  const pressedRef = useRef(false);
  const readyAtRef = useRef(Date.now() + initialDebounceMs);

  useEffect(() => {
    // setiap kali hook dipasang ulang (scene baru), reset debounce awal
    readyAtRef.current = Date.now() + initialDebounceMs;
  }, [initialDebounceMs]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key.toLowerCase() !== keyName) return;

      // kalau tombol masih dianggap "holding" dari sebelumnya, abaikan
      if (pressedRef.current) return;
      pressedRef.current = true;

      if (!enabled) return;

      const now = Date.now();
      if (now < readyAtRef.current) return; // tahan sebentar setelah mount
      if (now - lastRef.current < cooldownMs) return;

      lastRef.current = now;
      if (typeof onEnter === "function") onEnter();
    };

    const onKeyUp = (e) => {
      if (e.key.toLowerCase() === keyName) pressedRef.current = false;
    };

    // kalau tab balik fokus, anggap tombol sudah dilepas
    const onVisibility = () => {
      if (!document.hidden) pressedRef.current = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, onEnter, keyName, cooldownMs]);
}
