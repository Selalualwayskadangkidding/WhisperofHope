// simple bubble di atas kepala/area pintu
export default function DoorHint({ show, x, y, text = "Tekan E untuk interaksi dengan pintu" }) {
  if (!show) return null;
  const style = {
    position: "absolute",
    left: x,
    top: y,
    transform: "translate(-50%, -110%)",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 1,
    pointerEvents: "none",
    whiteSpace: "nowrap",
  };
  return <div style={style}>{text}</div>;
}
