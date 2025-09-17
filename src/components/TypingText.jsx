import React, { useEffect, useState, useRef } from "react";
import "../styles/TypingText.css";

export default function TypingText({
  text = "",
  speed = 50,
  onDone,
  forceFinish = false,
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let i = 0;
    audioRef.current = new Audio("/assets/sounds/typing.mp3");

    setDisplayedText("");
    setIsDone(false);
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const currentChar = text.charAt(i);
      setDisplayedText((prev) => prev + currentChar);

      if (i > 0 && currentChar !== " " && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      i++;
      if (i >= text.length) {
        clearInterval(intervalRef.current);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsDone(true);
        if (onDone) onDone();
      }
    }, speed);

    return () => {
      clearInterval(intervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [text, speed]);

  // Handle skip animasi
  useEffect(() => {
    if (forceFinish && !isDone) {
      clearInterval(intervalRef.current);
      setDisplayedText(text);
      setIsDone(true);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (onDone) onDone();
    }
  }, [forceFinish, text, isDone]);

  return (
    <p className={`typing-text ${isDone ? "done" : ""}`}>
      {displayedText}
    </p>
  );
}
