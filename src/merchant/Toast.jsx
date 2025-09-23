import { useEffect, useState } from "react";
import "./styles/merchant.css";

export default function Toast({ text, show, onDone, duration = 5000 }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const t1 = setTimeout(() => setVisible(false), duration - 300);
    const t2 = setTimeout(() => onDone?.(), duration);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [show, duration, onDone]);

  return (
    <div className={`toast-top ${visible ? "enter" : "leave"}`}>
      {text}
    </div>
  );
}
