"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-forest-green text-white rounded-xl p-4 flex items-center justify-between shadow-lg z-50">
      <div>
        <p className="font-medium text-sm">Add to Home Screen</p>
        <p className="text-xs opacity-80">
          Use Better Birder like a native app
        </p>
      </div>
      <button
        onClick={() => {
          prompt.prompt();
          setPrompt(null);
        }}
        className="bg-white text-forest-green text-sm font-medium px-4 py-2 rounded-lg"
      >
        Install
      </button>
    </div>
  );
}
