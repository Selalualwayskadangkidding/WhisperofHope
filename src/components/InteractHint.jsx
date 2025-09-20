// src/components/InteractHint.jsx
import React from "react";
import "../styles/cleaning.css";

/**
 * Hint interaksi “Tekan E …”
 * Posisi absolut relatif ke container scene (yang harus position:relative).
 * Props:
 *  - x, y : titik anchor (px)
 *  - text : string
 *  - offsetX, offsetY : geser posisi hint (default: di atas anchor)
 */
export default function InteractHint({
  x = 0,
  y = 0,
  text = "Tekan E",
  offsetX = 0,
  offsetY = -28,
}) {
  return (
    <div
      className="interact-hint"
      style={{
        left: Math.round(x + offsetX),
        top: Math.round(y + offsetY),
      }}
    >
      <kbd>E</kbd>
      <span>{text}</span>
    </div>
  );
}
