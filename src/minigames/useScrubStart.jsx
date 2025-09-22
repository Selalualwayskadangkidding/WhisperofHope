// src/minigames/useScrubStart.jsx
import { useCallback, useState } from "react";
import ScrubMinigame from "./ScrubMiniGame.jsx"; // pastikan casingnya sama!

export default function useScrubStart() {
  const [overlay, setOverlay] = useState(null);

  const startScrub = useCallback(({ label, required = 1400 }) => {
    return new Promise((resolve) => {
      setOverlay(
        <ScrubMinigame
          label={label}
          required={required}
          onDone={() => {
            setOverlay(null);
            resolve(true);
          }}
          onCancel={() => {
            setOverlay(null);
            resolve(false);
          }}
        />
      );
    });
  }, []);

  return { startScrub, ScrubPortal: overlay };
}
