// src/components/InteractHint.jsx
export default function InteractHint({
  visible,
  text = "E — Interact",
  x = 0,
  y = 0,
  z = 60,             // <-- pastikan di atas player/sampah
}) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%,-130%)",
        padding: "6px 10px",
        background: "rgba(0,0,0,0.65)",
        color: "#fff",
        borderRadius: 6,
        fontFamily: "ui-monospace, Menlo, monospace",
        fontSize: 13,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: z,

        // bikin “stroke” agar kebaca di map terang
        textShadow:
          "0 1px 0 #000, 0 -1px 0 #000, 1px 0 0 #000, -1px 0 0 #000, 0 0 4px rgba(0,0,0,.6)",
        boxShadow: "0 2px 6px rgba(0,0,0,.35)",
      }}
    >
      {text}
    </div>
  );
}
