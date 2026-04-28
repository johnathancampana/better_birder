"use client";

import { useState } from "react";

const LEVELS = [
  { name: "Egg",           min: 0,    max: 99   },
  { name: "Hatchling",     min: 100,  max: 299  },
  { name: "Fledgling",     min: 300,  max: 699  },
  { name: "Songbird",      min: 700,  max: 1499 },
  { name: "Field Expert",  min: 1500, max: 2999 },
  { name: "Master Birder", min: 3000, max: Infinity },
];

export function XPLegend() {
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
        How do levels and XP work?
      </button>

      {open && (
        <div className="mt-2 rounded-lg bg-ink/[0.03] border border-ink/5 p-3 text-xs text-ink/60 space-y-3">
          <p>You earn XP by completing quizzes — <span className="font-medium text-ink/80">10 XP per correct answer</span> plus a <span className="font-medium text-ink/80">20 XP bonus</span> for finishing.</p>
          <p>As you accumulate XP, you advance through birder levels — a measure of your overall experience in the field.</p>
          <div className="space-y-1.5">
            {LEVELS.map((level) => (
              <div key={level.name} className="flex items-center justify-between">
                <span className="font-medium text-ink/80">{level.name}</span>
                <span className="text-ink/40">
                  {level.max === Infinity
                    ? `${level.min.toLocaleString()}+ XP`
                    : `${level.min.toLocaleString()} – ${level.max.toLocaleString()} XP`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
