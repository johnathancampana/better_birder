"use client";

import { useState, useRef, useEffect } from "react";

export function AudioPlayer({ src, label }: { src: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    function pauseOthers() {
      document.querySelectorAll("audio").forEach((audio) => {
        if (audio !== el) audio.pause();
      });
    }
    el.addEventListener("play", pauseOthers);
    return () => el.removeEventListener("play", pauseOthers);
  }, []);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play();
    }
    setPlaying(!playing);
  }

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
      <button
        onClick={toggle}
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          playing
            ? "bg-forest-green text-white"
            : "bg-forest-green/10 text-forest-green hover:bg-forest-green/20"
        }`}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      {label && <span className="text-xs text-ink/40">{label}</span>}
    </div>
  );
}
