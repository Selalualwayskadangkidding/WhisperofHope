// src/components/TrashSprite.jsx
export default function TrashSprite({
  x, y, w, h,
  sprite,
  alt = "trash",
  z = 3,
  vw, vh,          // optional: ukuran visual; default = w,h hitbox
  focused = false, // NEW: highlight ketika jadi target
  style = {},      // NEW: allow override style dari parent
  className = "",  // NEW: allow className ekstra
  ...rest
}) {
  // Ukuran visual (kalau nggak dikasih, pakai w,h dari rect)
  const VW = Math.max(1, vw ?? w ?? 16);
  const VH = Math.max(1, vh ?? h ?? 16);

  // ANCHOR: bottom-center ke hitbox (biar nyatu sama lantai)
  const left = (x ?? 0) + (w ?? VW) / 2 - VW / 2;
  const top  = (y ?? 0) - (VH - (h ?? VH));

  return (
    <img
      src={sprite}
      alt={alt}
      className={`lr-trash pixelated ${className}`}
      draggable={false}
      style={{
        position: "absolute",
        left,
        top,
        width: VW,
        height: VH,
        imageRendering: "pixelated",
        zIndex: z,             // pastikan di atas map
        pointerEvents: "none",
        // highlight halus saat fokus
        filter: focused ? "drop-shadow(0 0 6px rgba(255,255,255,0.6))" : "none",
        ...style,
      }}
      onError={(e) => {
        // fallback: kalau path salah, kelihatan kotak merah biar ketahuan
        e.currentTarget.style.display = "block";
        e.currentTarget.style.background = "rgba(255,0,0,0.3)";
        e.currentTarget.src =
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="; // 1x1
      }}
      aria-hidden // purely visual (interaksi global via E)
      {...rest}
    />
  );
}
