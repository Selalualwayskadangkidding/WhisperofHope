import React from "react";
import { usePlayer, formatIDR } from "../state/player.jsx";
import "../styles/status-hud.css";

const THEMES = {
  yard:       { barBg: "#3b3b3b", fill: "#c0e7d9", text: "#e6ffe6", money: "#d1fae5", border: "#1a1a1a" },
  livingroom: { barBg: "#3b3225", fill: "#f6d58b", text: "#fff7e6", money: "#fde68a", border: "#1a140a" },
  hallway:    { barBg: "#2c2b3e", fill: "#cfc5ff", text: "#ede9fe", money: "#ddd6fe", border: "#141320" },
  kitchen:    { barBg: "#3b1f1f", fill: "#f5b0b0", text: "#ffeaea", money: "#fecaca", border: "#1a0d0d" },
  bathroom:   { barBg: "#1d3037", fill: "#b7f2ee", text: "#e0f7fa", money: "#a5f3fc", border: "#0c171b" },
  roomkakak:  { barBg: "#322235", fill: "#f9c1df", text: "#fce7f3", money: "#f9a8d4", border: "#160f19" },
  roomortu:   { barBg: "#282241", fill: "#dfe0ff", text: "#ede9fe", money: "#c7d2fe", border: "#120f22" },
  default:    { barBg: "#333",    fill: "#cfcfcf", text: "#f3f4f6", money: "#e5e7eb", border: "#111" },
};

function PixelBar({ title, icon, value, theme, segments = 10 }) {
  const pct = Math.max(0, Math.min(100, value));
  const minVisible = pct > 0 ? Math.max(4, pct) : 0;

  return (
    <div className="sh-block">
      <div className="sh-title">
        <span className="sh-icon">{icon}</span> {title}
      </div>
      <div
        className="sh-bar-pixel"
        style={{
          "--bar-bg": theme.barBg,
          "--bar-fill": theme.fill,
          "--bar-border": theme.border,
          "--segments": segments,
        }}
      >
        <div className="sh-pixel-track" />
        <div className="sh-pixel-fill" style={{ width: `${minVisible}%` }} />
      </div>
    </div>
  );
}

export default function StatusHUD({ scene = "default", hidden = false }) {
  const { hunger, thirst, money } = usePlayer();
  const theme = THEMES[scene] ?? THEMES.default;
  if (hidden) return null;

  return (
    <div className="sh-wrap" style={{ color: theme.text }}>
      <div className="sh-money" style={{ color: theme.money }}>
        {formatIDR(money)}
      </div>

      <PixelBar title="HUNGER" icon="🍗" value={hunger} theme={theme} />
      <PixelBar title="THIRST" icon="💧" value={thirst} theme={theme} />
    </div>
  );
}
