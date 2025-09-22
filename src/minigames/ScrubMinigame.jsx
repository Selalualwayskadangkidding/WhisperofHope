// src/minigames/ScrubMinigame.jsx
import { useEffect, useRef, useState } from "react";

/** Segmented bar (gaya sama dengan HUD kebersihan), dengan warna bisa di-set */
function SegmentedBar({ value = 0, segments = 20, height = 18, fillColor = "#4da6ff" }) {
  const pct = Math.max(0, Math.min(1, value));
  const filled = Math.round(pct * segments);

  return (
    <div
      style={{
        width: "100%",
        height,
        background: "#2b2b2b",
        border: "2px solid #555",
        borderRadius: 6,
        display: "flex",
        gap: 2,
        padding: 2,
      }}
    >
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            borderRadius: 3,
            background: i < filled ? fillColor : "transparent",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Overlay mini-game mengelap dengan input mouse:
 * - Gerakkan mouse untuk mengisi progress.
 * - ESC atau klik kanan = batal.
 *
 * Props:
 *   onDone()         -> dipanggil saat progress penuh
 *   onCancel()       -> dipanggil saat batal
 *   label?: string   -> teks instruksi
 *   required?: number -> total jarak gerak mouse dibutuhkan (px), default 1400
 *   barColor?: string -> warna isi bar (CSS color)
 */
export default function ScrubMinigame({
  onDone,
  onCancel,
  label = "Gerakkan mouse untuk mengelap",
  required = 1400,
  barColor = "#4da6ff", // ⬅️ biru; ganti kalau mau
}) {
  const [progress, setProgress] = useState(0); // 0..1
  const lastPos = useRef({ x: null, y: null });
  const idleRef = useRef(null);

  // PARAM TUNING
  const MIN_DELTA = 1.5;   // gerak < ini diabaikan (noise)
  const MAX_TICK  = 24;    // ⬅️ dari 40 → 24 (biar gak terlalu cepat)
  const SLOWDOWN  = 0.7;   // ⬅️ perlambat global 30%
  const IDLE_TIMEOUT = 900;

  // Lock scroll & cursor selama overlay aktif (cegah viewport geser)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevCursor = document.body.style.cursor;
    document.body.style.overflow = "hidden";
    document.body.style.cursor = "crosshair";

    const preventScroll = (e) => {
      const k = e.key?.toLowerCase?.();
      if (
        e.type === "wheel" ||
        k === "arrowup" || k === "arrowdown" ||
        k === "arrowleft" || k === "arrowright" ||
        k === " "
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("keydown", preventScroll, { passive: false });

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.cursor = prevCursor;
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("keydown", preventScroll);
    };
  }, []);

  useEffect(() => {
    function onMouseMove(e) {
      const { clientX: x, clientY: y } = e;
      if (lastPos.current.x == null) {
        lastPos.current = { x, y };
        return;
      }
      let dx = x - lastPos.current.x;
      let dy = y - lastPos.current.y;
      lastPos.current = { x, y };

      let d = Math.hypot(dx, dy);
      if (d < MIN_DELTA) d = 0;
      if (d > MAX_TICK) d = MAX_TICK;

      // perlambat global
      d *= SLOWDOWN;

      if (d > 0) {
        // hitung progress
        setProgress((prev) => {
          // convert progress -> jarak lalu tambah d
          const currentDist = prev * required;
          const nextDist = currentDist + d;
          const p = Math.min(1, nextDist / required);
          if (p >= 1) queueMicrotask(() => onDone?.());
          return p;
        });
      }

      if (idleRef.current) clearTimeout(idleRef.current);
      idleRef.current = setTimeout(() => {
        // bisa dipakai untuk animasi “wiggle” instruksi kalau mau
      }, IDLE_TIMEOUT);
    }

    function onKeyDown(e) {
      if (e.key === "Escape") onCancel?.();
    }
    function onContextMenu(e) {
      e.preventDefault();
      onCancel?.();
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("contextmenu", onContextMenu);
      if (idleRef.current) clearTimeout(idleRef.current);
    };
  }, [onDone, onCancel, required]);

  return (
    // overlay FIXED supaya niban map
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "flex-end",     // ⬅️ dorong ke bawah
        justifyContent: "center",   // ⬅️ taruh di tengah horizontal
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(2px)",
        paddingBottom: 48,          // ⬅️ jarak dari bawah layar
      }}
    >
      <div
        style={{
          width: 460,
          padding: 16,
          borderRadius: 14,
          background: "rgba(20,20,24,0.9)",
          boxShadow: "0 10px 24px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "white",
            marginBottom: 10,
            textAlign: "center",
            letterSpacing: 0.2,
          }}
        >
          {label}
        </div>

        {/* Progress bar */}
        <SegmentedBar value={progress} fillColor={barColor} />

        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
          }}
        >
          Tips: gerakkan mouse memutar/zig-zag. ESC untuk batal.
        </div>
      </div>
    </div>
  );

}
