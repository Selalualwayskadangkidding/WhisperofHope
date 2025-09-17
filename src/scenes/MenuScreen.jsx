// src/scenes/MenuScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import "../styles/MenuScreen.css";

export default function MenuScreen({ onStartNew, onExit, onGoHallway }) {
  const [showGuide, setShowGuide] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Ref untuk audio
  const bgmRef = useRef(null);
  const clickRef = useRef(null);
  const turnoffRef = useRef(null);

  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = 0.5;
      bgmRef.current.loop = true;
      bgmRef.current.play().catch(() => {}); // biar ga error autoplay
    }
  }, []);

  const playClick = () => {
    if (!isMuted && clickRef.current) {
      clickRef.current.currentTime = 0;
      clickRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!isMuted && turnoffRef.current) {
      turnoffRef.current.currentTime = 0;
      turnoffRef.current.play();
    }
    setIsMuted(!isMuted);
    if (bgmRef.current) {
      bgmRef.current.muted = !bgmRef.current.muted;
    }
  };

  return (
    <div className="menu-container">
      {/* BGM */}
      <audio ref={bgmRef} src="/assets/sounds/Aveture.mp3" />
      <audio ref={clickRef} src="/assets/sounds/clicksound.wav" />
      <audio ref={turnoffRef} src="/assets/sounds/turnof.wav" />

      {/* Tombol Mute di pojok kanan atas */}
      <button className="sound-btn" onClick={toggleMute}>
        {isMuted ? "🔇" : "🔊"}
      </button>

      {/* Judul */}
      <div className="menu-title">
        HARAPAN <br /> VILLAGE
      </div>

      {/* Tombol Menu */}
      <div className="menu-buttons">
        <button
          className="menu-btn"
          onClick={() => {
            playClick();
            if (onStartNew) onStartNew(); // ⬅ prop dari App.jsx
          }}
        >
          Start
        </button>

        <button
          className="menu-btn"
          onClick={() => {
            playClick();
            setShowGuide(true);
          }}
        >
          Guide
        </button>

        {/* Tombol baru langsung ke Hallway */}
        <button
          className="menu-btn"
          onClick={() => {
            playClick();
            if (onGoHallway) onGoHallway(); // ⬅ prop baru dari App.jsx
          }}
        >
          Go to Hallway
        </button>

        <button
          className="menu-btn"
          onClick={() => {
            playClick();
            if (onExit) onExit();
            else window.close();
          }}
        >
          Exit
        </button>
      </div>

      {/* Popup Guide */}
      {showGuide && (
        <div className="guide-box">
          <div className="guide-title">Guide</div>
          <div className="guide-content">
            <p>1. Use arrow keys / WASD to move your character.</p>
            <p>2. Press E to interact with objects.</p>
            <p>3. Do quest for rewards.</p>
            <p>4. Press Q to interact with NPC.</p>
            <p>5. Press I to open inventory.</p>
          </div>
          <button
            className="guide-close"
            onClick={() => {
              playClick();
              setShowGuide(false);
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
