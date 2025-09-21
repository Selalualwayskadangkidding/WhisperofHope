import React from "react";
import "../styles/cleaning.css";

const BAR_SEGMENTS = 16;

export default function CleanlinessHUD({ progress, checklist, collapsed, onToggle }) {
  const filled = Math.round((progress / 100) * BAR_SEGMENTS);

  return (
    <div className="hud-root">
      <button className="hud-header" onClick={onToggle}>
        <span>Kebersihan</span>
        <div className="hud-bar">
          {Array.from({ length: BAR_SEGMENTS }).map((_, i) => (
            <div key={i} className={`hud-segment ${i < filled ? "filled" : ""}`} />
          ))}
        </div>
        <span className="hud-percent">{progress}%</span>
        <span className="hud-hint">[Tab]</span>
      </button>

      {!collapsed && (
        <div className="hud-list">
          {Object.entries(checklist).map(([key, v]) => (
            <div key={key} className="hud-row">
              <span>{v.label}</span>
              <span>{(v.done || 0)}/{(v.total || 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
