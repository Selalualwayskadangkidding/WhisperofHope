export default function TrashSprite({
  x, y, w, h,
  sprite,
  alt = "trash",
  z = 2,
  vw, vh,               // opsi ukuran visual; default ikut w,h
}) {
  const VW = Math.max(1, vw ?? w ?? 16);
  const VH = Math.max(1, vh ?? h ?? 16);

  // anchor visual ke bottom-center hitbox
  const left = (x ?? 0) + (w ?? VW) / 2 - VW / 2;
  const top  = (y ?? 0) - (VH - (h ?? VH));

  return (
    <img
      src={sprite}
      alt={alt}
      className="lr-trash pixelated"
      draggable={false}
      style={{
        position: "absolute",
        left, top,
        width: VW, height: VH,
        imageRendering: "pixelated",
        zIndex: z,
        pointerEvents: "none",
      }}
      onError={(e) => {
        // gampang deteksi path salah (jadi kotak merah transparan)
        e.currentTarget.style.background = "rgba(255,0,0,0.3)";
        e.currentTarget.src =
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
      }}
    />
  );
}
