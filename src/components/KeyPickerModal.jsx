// src/components/KeyPickerModal.jsx
import React from "react";
import "../styles/inventory-panel.css";
import { itemIcon, itemLabel } from "../state/itemsDb.js";

export default function KeyPickerModal({ keys = [], onPick, onCancel }) {
  return (
    <div className="inv-overlay" onClick={onCancel}>
      <div className="inv-book" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="inv-inner" style={{ gridTemplateColumns: "1fr" }}>
          <div className="inv-right">
            <div className="inv-title" style={{ justifyContent: "space-between" }}>
              <span>Pilih Kunci</span>
              <button className="inv-close" onClick={onCancel}>Batal (Esc)</button>
            </div>

            <div className="inv-card">
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12
              }}>
                {keys.map((id) => (
                  <button key={id} className="inv-slot" onClick={() => onPick(id)} title={itemLabel(id)}>
                    {itemIcon(id) ? (
                      <img src={itemIcon(id)} alt={itemLabel(id)} />
                    ) : (
                      <span style={{ fontSize: 12 }}>{itemLabel(id)}</span>
                    )}
                  </button>
                ))}
                {keys.length === 0 && (
                  <div style={{ opacity: .8 }}>Tidak ada kunci yang cocok.</div>
                )}
              </div>
              <div className="inv-desc" style={{ marginTop: 12 }}>
                Pilih kunci yang sesuai. Salah pilih → gagal membuka.
              </div>
            </div>

            <div />
          </div>
        </div>
      </div>
    </div>
  );
}
