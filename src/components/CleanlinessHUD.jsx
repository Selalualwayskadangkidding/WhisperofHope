// src/components/CleanlinessHUD.jsx
import React from "react";
import "../styles/cleaning.css";

/**
 * Meter kebersihan + checklist ringkas.
 * Props:
 *  - progress: number 0..100
 *  - checklist: {
 *      dust:{done,total,label}, corner_dust:{...}, paper:{...}, snack:{...},
 *      stain:{...}, cobweb:{...}, magazine:{...}, remote:{...}, plant_dry:{...}
 *    }
 */
export default function CleanlinessHUD({ progress = 0, checklist = {} }) {
  const entries = [
    "dust",
    "corner_dust",
    "paper",
    "snack",
    "stain",
    "cobweb",
    "magazine",
    "remote",
    "plant_dry",
  ].filter((k) => checklist[k]);

  return (
    <div className="clean-hud">
      <div className="clean-meter">
        <div className="clean-meter-fill" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        <div className="clean-meter-text">{progress}%</div>
      </div>

      <div className="clean-list">
        {entries.map((k) => {
          const { done = 0, total = 0, label = k } = checklist[k] || {};
          const ok = total > 0 && done >= total;
          return (
            <div key={k} className={`clean-item ${ok ? "ok" : ""}`}>
              <span className="clean-item-check">{ok ? "✓" : "•"}</span>
              <span className="clean-item-label">{label}</span>
              <span className="clean-item-count">
                {done}/{total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
