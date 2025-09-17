import React, { useState, useEffect, useRef } from "react";
import TypingText from "../components/TypingText";
import "../styles/IntroScene.css";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroScene({ onFinish }) {
const [scenes, setScenes] = useState([]);
const [step, setStep] = useState(0);
const [finishedTyping, setFinishedTyping] = useState(false);
const [forceFinish, setForceFinish] = useState(false);

const bgmRef = useRef(null);
const sfxRef = useRef(null);

  // Load JSON
useEffect(() => {
    fetch("/assets/data/introTexts.json")
    .then((res) => res.json())
    .then((data) => setScenes(data.intro || []))
    .catch((err) => console.error("Gagal load introTexts.json:", err));
}, []);

  // Play BGM
useEffect(() => {
    if (bgmRef.current && scenes.length > 0) {
    bgmRef.current.volume = 0.4;
    bgmRef.current.loop = true;
    bgmRef.current.play().catch(() => {});
    }
}, [scenes]);

  // Play SFX kalau ada di scene sekarang
useEffect(() => {
    if (!scenes[step]) return;

    if (sfxRef.current) {
    sfxRef.current.pause();
    sfxRef.current.currentTime = 0;
    }

    if (scenes[step].audio) {
    sfxRef.current.src = scenes[step].audio;
    sfxRef.current.play().catch(() => {});
    }
}, [step, scenes]);

const handleNext = () => {
  if (!finishedTyping) {
    // kalau teks masih ngetik → skip animasi
    setForceFinish(true);
    return;
  }

  // kalau teks sudah selesai → next step
  if (step < scenes.length - 1) {
    setStep(step + 1);
    setFinishedTyping(false);
    setForceFinish(false); // reset biar animasi jalan lagi di step baru
  } else {
    if (bgmRef.current) bgmRef.current.pause();
    onFinish();
  }
};




if (scenes.length === 0) {
    return <div className="intro-scene">Loading...</div>;
}

const current = scenes[step];

return (
<AnimatePresence mode="wait">
<motion.div
    key={step} // penting: biar tiap step dianggap halaman baru
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.8 }}
    className="intro-scene"
    onClick={handleNext}
    style={{
    backgroundImage: `url(${current.image})`,
    backgroundSize: current.fit === "contain" ? "contain" : "cover",
    backgroundColor: "black",
    }}
>
    {/* BGM */}
    <audio ref={bgmRef} src="/assets/sounds/Aveture.mp3" loop />
    <audio ref={sfxRef} />

{/* Text box */}
<div className="intro-box">
<TypingText
    text={current.text}
    speed={40}
    onDone={() => setFinishedTyping(true)}
  forceFinish={forceFinish}   // ✅ hanya true kalau user klik pas animasi
/>
{finishedTyping && <p className="next-hint">(Klik untuk lanjut...)</p>}



</div>
</motion.div>
</AnimatePresence>
);
}
