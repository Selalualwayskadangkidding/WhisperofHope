// src/components/DoorHint.jsx
export default function DoorHint({ show, text = "Tekan E" }) {
if (!show) return null;
return (
<div
style={{
position: "absolute",
left: "50%",
bottom: "120px", // tweak position (higher = bigger value)
transform: "translateX(-50%)",
padding: "6px 10px",
background: "rgba(0,0,0,0.65)",
color: "#fff",
fontSize: 14,
lineHeight: 1,
borderRadius: 8,
pointerEvents: "none",
userSelect: "none",
}}
>
{text}
</div>
);
}