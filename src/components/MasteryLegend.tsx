"use client";

import { useState } from "react";

export function MasteryLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-ink/40 hover:text-ink/60 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        How are these defined?
      </button>

      {open && (
        <div className="mt-2 rounded-lg bg-ink/[0.03] border border-ink/5 p-3 space-y-2 text-xs text-ink/60">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-2 h-2 rounded-full bg-forest-green flex-shrink-0" />
            <p><span className="font-medium text-ink/80">Mastered</span> — 70%+ correct on at least 10 sight and 10 sound questions.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-2 h-2 rounded-full bg-amber flex-shrink-0" />
            <p><span className="font-medium text-ink/80">Learning</span> — correct rate between 40–69% or fewer than 10 attempts in either category.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-2 h-2 rounded-full bg-danger flex-shrink-0" />
            <p><span className="font-medium text-ink/80">New</span> — not yet quizzed or correct rate below 40% in either category.</p>
          </div>
        </div>
      )}
    </div>
  );
}
