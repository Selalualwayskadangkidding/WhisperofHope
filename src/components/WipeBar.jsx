// src/components/WipeBar.jsx
import React, { useEffect, useRef, useState } from "react";
import "../styles/cleaning.css";

/**
 * Minigame lap noda: tahan E (atau prop holding=true) hingga penuh.
 * Props:
 *  - active: boolean → kalau false, tidak render apa-apa
 *  - holding: boolean → state “tombol E lagi ditahan” dari parent (optional)
 *  - requiredMs: durasi tahan (default 1000 ms)
 *  - onDone: callback saat full (dipanggil sekali)
 *  - onCancel: callback saat transisi dari aktif → non-aktif
 */
export default function WipeBar({
  active = false,
  holding,
  requiredMs = 1000,
  onDone,
  onCancel,
}) {
  const [progress, setProgress] = useState(0);
  const raf = useRef(null);
  const last = useRef(0);
  const doneRef = useRef(false);       // NEW: guard agar onDone sekali
  const prevActiveRef = useRef(false); // NEW: track transisi active
  const internalHolding = useKeyHoldInternal("KeyE");
  const isHolding = holding ?? internalHolding;

  // Transisi active → reset/progress
  useEffect(() => {
    // kalau sebelumnya aktif lalu sekarang non-aktif → cancel sekali
    if (prevActiveRef.current && !active) {
      onCancel && onCancel();
    }
    prevActiveRef.current = active;

    if (!active) {
      cancelAnimationFrame(raf.current);
      setProgress(0);
      doneRef.current = false;
      return;
    }

    // aktif: mulai loop
    last.current = performance.now();
    doneRef.current = false;
    tick();
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Saat holding berubah
  useEffect(() => {
    if (!active) return;
    if (!isHolding) return; // pause bila tidak menahan
    last.current = performance.now();
    tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHolding, active]);

  function tick() {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame((t) => {
      const dt = Math.max(0, t - last.current);
      last.current = t;

      setProgress((p) => {
        let next = p;
        if (isHolding) next = Math.min(1, p + dt / requiredMs);
        else next = Math.max(0, p - dt / (requiredMs * 1.2)); // sedikit mundur kalau lepas

        if (next >= 1 && !doneRef.current) {
          doneRef.current = true;
          onDone && onDone();
          // stop anim loop setelah selesai
          return 1;
        }

        // lanjut loop kalau belum selesai
        if (!doneRef.current) tick();
        return next;
      });
    });
  }

  if (!active) return null;

  return (
    <div className="wipebar-wrap">
      <div className="wipebar">
        <div className="wipebar-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <div className="wipebar-text">Tahan E untuk mengelap...</div>
    </div>
  );
}

/** Key hold kecil kalau parent nggak kasih prop holding */
function useKeyHoldInternal(code = "KeyE") {
  const [hold, setHold] = useState(false);
  useEffect(() => {
    const down = (e) => e.code === code && setHold(true);
    const up = (e) => e.code === code && setHold(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [code]);
  return hold;
}
