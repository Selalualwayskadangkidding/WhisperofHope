// src/components/TalkPanel.jsx
import { useEffect } from "react";

export default function TalkPanel({ open, name, text, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter") onClose?.();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "70%",
          maxWidth: 820,
          marginBottom: 32,
          background: "rgba(30, 20, 8, 0.95)",
          border: "1px solid #7a552a",
          borderRadius: 12,
          color: "#f7e3c0",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid #7a552a",
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          {name ?? "NPC"}
        </div>
        <div style={{ padding: "14px 16px", lineHeight: 1.4, fontSize: 16 }}>
          {text}
        </div>
        <div
          style={{
            padding: "8px 14px",
            borderTop: "1px solid #7a552a",
            fontSize: 12,
            color: "#c9b18c",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Enter / Klik untuk menutup</span>
          <button
            onClick={onClose}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #7a552a",
              background: "#3b2816",
              color: "#f7e3c0",
              cursor: "pointer",
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
