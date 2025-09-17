// src/mechanics/DebugCollisionOverlay.jsx
import { useEffect, useRef, useState } from "react";

export default function DebugCollisionOverlay({
  active,
  rects,
  setRects,
  containerRef,
  storageKey = "hv_collision_rects",
  scale = 1, // <<=== NEW: scale visual container (default 1)
}) {
  const [dragging, setDragging] = useState(null); // {id,mode,offX,offY}
  const [cursor, setCursor] = useState("default");
  const localRects = useRef(rects);

  useEffect(() => { localRects.current = rects; }, [rects]);

  useEffect(() => {
    if (!rects || !rects.length) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(rects));
    } catch (err) {
      console.warn("[DebugCollisionOverlay] gagal simpan:", err);
    }
  }, [rects, storageKey]);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const toLocal = (e) => {
      const r = container.getBoundingClientRect();
      // normalisasi koordinat mouse terhadap scale agar balik ke
      // koordinat asli map (sebelum transform: scale)
      const x = (e.clientX - r.left) / (scale || 1);
      const y = (e.clientY - r.top) / (scale || 1);
      return { x, y };
    };

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      const { x, y } = toLocal(e);

      for (let ob of localRects.current) {
        if (x >= ob.x && x <= ob.x + ob.w && y >= ob.y && y <= ob.y + ob.h) {
          setDragging({
            id: ob.id,
                        mode: (e.altKey || e.metaKey || e.button === 2) ? "resize" : "move",

            offX: x - ob.x,
            offY: y - ob.y,
          });
          break;
        }
      }
    };

    const onMouseMove = (e) => {
      if (!dragging) return;
      const { x, y } = toLocal(e);

      setRects((prev) =>
        prev.map((ob) => {
          if (ob.id !== dragging.id) return ob;
          if (dragging.mode === "move") {
            return { ...ob, x: x - dragging.offX, y: y - dragging.offY };
          } else {
            return {
              ...ob,
              w: Math.max(4, x - ob.x),
              h: Math.max(4, y - ob.y),
            };
          }
        })
      );
    };

    const onMouseUp = () => setDragging(null);

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [active, dragging, setRects, containerRef, scale]);

  useEffect(() => {
    if (!active) setCursor("default");
    else if (dragging?.mode === "move") setCursor("move");
    else if (dragging?.mode === "resize") setCursor("nwse-resize");
    else setCursor("crosshair");
  }, [active, dragging]);

  if (!active) return null;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 999, cursor }}>
      {rects.map((ob) => (
        <div
          key={ob.id}
          style={{
            position: "absolute",
            left: ob.x,
            top: ob.y,
            width: ob.w,
            height: ob.h,
            border: "1px solid red",
            background: "rgba(255,0,0,0.15)",
            fontSize: 10,
            color: "#fff",
            pointerEvents: "auto",
            userSelect: "none",
          }}
        >
          #{ob.id} ({ob.type})
        </div>
      ))}
    </div>
  );
}
