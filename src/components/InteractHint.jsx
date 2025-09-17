export default function InteractHint({ visible, text = "E — Interact", x = 0, y = 0 }) {
  if (!visible) return null;
  // Posisi bebas (absolute) — kamu bisa sesuaikan sesuai kamera/viewport
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: "6px 10px",
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        borderRadius: 6,
        fontFamily: "monospace",
        fontSize: 14,
        pointerEvents: "none",
        transform: "translate(-50%,-120%)",
        whiteSpace: "nowrap",
        zIndex: 40
      }}
    >
      {text}
    </div>
  );
}
