// src/components/PixelProgressBar.jsx
export default function PixelProgressBar({
  value = 0,          // 0..100
  segments = 20,      // banyak kotak
  height = 12,        // tinggi bar
}) {
  const v = Math.max(0, Math.min(100, value));
  const filled = Math.round((v / 100) * segments);

  // warna by threshold
  let hue = 0; // red
  if (v >= 75) hue = 110;        // green-ish
  else if (v >= 50) hue = 60;    // yellow
  else if (v >= 25) hue = 30;    // orange

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: 2,
        background: "#1b1b1f",
        border: "2px solid #000",
        borderRadius: 6,
        boxShadow: "inset 0 0 0 2px #3a3a3a",
      }}
    >
      {Array.from({ length: segments }).map((_, i) => {
        const on = i < filled;
        return (
          <div
            key={i}
            style={{
              width: 10,
              height,
              border: "2px solid #000",
              borderRadius: 3,
              boxShadow: "inset 0 0 0 2px #3a3a3a",
              background: on
                ? `linear-gradient(#fff8, #0000), hsl(${hue} 80% 45%)`
                : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}
