"use client";

import { useState } from "react";

export function WelcomeBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-forest-green text-white px-5 py-4 mb-4">
      <p className="text-sm font-medium">🎉 Nice work! Time to practice.</p>
      <button
        onClick={() => setVisible(false)}
        className="text-white/60 hover:text-white transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
