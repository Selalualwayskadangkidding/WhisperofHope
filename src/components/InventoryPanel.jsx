// src/components/InventoryPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../styles/inventory-panel.css";
import { itemIcon, itemLabel } from "../state/itemsDb.js";

export default function InventoryPanel({
  items = [],                 // array of itemId string, contoh: ["key_front", "key_house"]
  onClose,                    // function untuk menutup panel
  onItemClick,                // (opsional) dipanggil saat item diklik → onItemClick(itemId)
  initialSelectedId = null,   // (opsional) seleksi awal saat panel dibuka
  disableBackdropClose = false, // (opsional) true = klik luar gak nutup (buat “paksa pilih kunci”)
  hideCloseButton = false,      // (opsional) sembunyikan tombol "Tutup"
}) {
  const [selected, setSelected] = useState(
    initialSelectedId ?? items[0] ?? null
  );

  useEffect(() => {
    // kalau initialSelectedId berubah dari luar, sync ke dalam
    if (initialSelectedId != null) setSelected(initialSelectedId);
  }, [initialSelectedId]);

  const selectedLabel = useMemo(
    () => (selected ? itemLabel(selected) : "—"),
    [selected]
  );

  function handleBackdropClick() {
    if (!disableBackdropClose && onClose) onClose();
  }

  function handleSlotClick(id) {
    if (!id) return;
    setSelected(id);
    if (onItemClick) onItemClick(id);
  }

  return (
    <div className="inv-overlay" onClick={handleBackdropClick}>
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
                const id = items[i]; // id bisa undefined untuk slot kosong
                const isSel = id && id === selected;
                return (
                  <button
                    key={i}
                    className={`inv-slot${isSel ? " is-selected" : ""}`}
                    onClick={() => id && handleSlotClick(id)}
                    title={id ? itemLabel(id) : ""}
                    aria-label={id ? itemLabel(id) : "Kosong"}
                  >
                    {id ? (
                      itemIcon(id) ? (
                        <img
                          src={itemIcon(id)}
                          alt={itemLabel(id)}
                          onError={(e) => { e.currentTarget.remove(); }}
                          style={{ imageRendering: "pixelated" }}
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
              {!hideCloseButton && (
                <button className="inv-close" onClick={onClose}>Tutup (I)</button>
              )}
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
