// src/components/InventoryPanel.jsx
import React, { useMemo, useState } from "react";
import "../styles/inventory-panel.css";
import { itemIcon, itemLabel } from "../state/itemsDb.js";

export default function InventoryPanel({ items = [], onClose }) {
  const [selected, setSelected] = useState(items[0] ?? null);
  const selectedLabel = useMemo(() => (selected ? itemLabel(selected) : "—"), [selected]);

  return (
    <div className="inv-overlay" onClick={onClose}>
      <div className="inv-book" onClick={(e) => e.stopPropagation()}>
        <div className="inv-tabs" aria-hidden>
          <div className="inv-tab" /><div className="inv-tab" /><div className="inv-tab" />
        </div>

        <div className="inv-inner">
          {/* LEFT */}
          <div className="inv-left">
            <div className="inv-title">Inventori</div>

            <div className="inv-grid">
              {Array.from({ length: Math.max(24, items.length) }).map((_, i) => {
                const id = items[i];
                const isSel = id && id === selected;
                return (
                  <button
                    key={i}
                    className={`inv-slot${isSel ? " is-selected" : ""}`}
                    onClick={() => id && setSelected(id)}
                    title={id ? itemLabel(id) : ""}
                    aria-label={id ? itemLabel(id) : "Kosong"}
                  >
                    {id ? (
                      itemIcon(id) ? (
                        <img
                          src={itemIcon(id)}
                          alt={itemLabel(id)}
                          onError={(e) => { e.currentTarget.remove(); }}
                        />
                      ) : (
                        <span style={{ fontSize: 12 }}>{itemLabel(id)}</span>
                      )
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="inv-pager">
              <button type="button" aria-label="Prev page">◄</button>
              <button type="button" aria-label="Next page">►</button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="inv-right">
            <div className="inv-title">
              <span>Detail Item</span>
              <button className="inv-close" onClick={onClose}>Tutup (I)</button>
            </div>

            <div className="inv-card">
              <div className="inv-hero">
                {selected ? (
                  itemIcon(selected) ? (
                    <img
                      src={itemIcon(selected)}
                      alt={selectedLabel}
                      style={{ maxWidth: "60%", imageRendering: "pixelated" }}
                      onError={(e) => { e.currentTarget.remove(); }}
                    />
                  ) : (
                    <span style={{ fontWeight: 700 }}>{selectedLabel}</span>
                  )
                ) : (
                  <span>—</span>
                )}
              </div>

              <div className="inv-desc">
                {selected ? (
                  <>
                    <b>{selectedLabel}</b>
                    <div style={{ marginTop: 6, opacity: .9 }}>
                      Item penting untuk progres game. Simpan baik-baik!
                    </div>
                  </>
                ) : (
                  <span>Pilih slot di kiri untuk melihat detail.</span>
                )}
              </div>
            </div>

            <div />
          </div>
        </div>
      </div>
    </div>
  );
}
