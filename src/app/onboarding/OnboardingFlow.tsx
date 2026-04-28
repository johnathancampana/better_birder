"use client";

import { useState } from "react";
import { completeOnboarding } from "./actions";

type Bird = {
  species_code: string;
  common_name: string;
  scientific_name: string;
  family: string;
};

export function OnboardingFlow({
  birds,
  photoUrls,
}: {
  birds: Bird[];
  photoUrls: Record<string, string>;
}) {
  const [step, setStep] = useState<0 | 1>(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleBird(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  const selectedCount = selected.size;
  const hasEnough = selectedCount >= 4;

  if (step === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="flex flex-col items-center max-w-sm w-full text-center gap-6">
          <span className="text-7xl" role="img" aria-label="Bird">
            🐦
          </span>
          <h1 className="text-3xl font-bold text-forest-green">
            Welcome to Better Birder
          </h1>
          <p className="text-ink/60 text-base leading-relaxed">
            Learn to identify birds by sight and sound. Add the birds you&apos;ve
            spotted, and we&apos;ll build you a personalized quiz that gets smarter
            as you do.
          </p>
          <button
            onClick={() => setStep(1)}
            className="w-full max-w-xs bg-forest-green text-white font-semibold py-3 px-6 rounded-xl hover:bg-forest-green/90 transition-colors"
          >
            Get Started →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-ink">
          Which birds have you spotted?
        </h1>
        <p className="text-sm text-ink/50 mt-1">
          Pick at least 4 to start. You can always add more later.
        </p>
        <p
          className={`text-sm font-medium mt-2 ${
            hasEnough ? "text-forest-green" : "text-ink/30"
          }`}
        >
          {selectedCount} selected
        </p>
      </div>

      {/* Bird grid */}
      <div className="px-4 pb-28 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {birds.map((bird) => {
            const isSelected = selected.has(bird.species_code);
            const photoUrl = photoUrls[bird.species_code];

            return (
              <button
                key={bird.species_code}
                type="button"
                onClick={() => toggleBird(bird.species_code)}
                className={`relative rounded-xl overflow-hidden text-left transition-all ${
                  isSelected
                    ? "border-2 border-forest-green"
                    : "border border-ink/10"
                }`}
              >
                {/* Photo */}
                <div className="aspect-square w-full relative bg-ink/5">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt={bird.common_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-ink/10 flex items-center justify-center">
                      <span className="text-3xl" role="img" aria-label="Bird">
                        🐦
                      </span>
                    </div>
                  )}

                  {/* Checkmark badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-forest-green rounded-full flex items-center justify-center shadow">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="white"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-center text-ink truncate">
                    {bird.common_name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-ink/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto">
          {hasEnough ? (
            <form action={completeOnboarding}>
              {/* Hidden inputs for each selected bird */}
              {birds
                .filter((b) => selected.has(b.species_code))
                .map((b) => (
                  <input
                    key={b.species_code}
                    type="hidden"
                    name="bird"
                    value={JSON.stringify({
                      species_code: b.species_code,
                      common_name: b.common_name,
                      scientific_name: b.scientific_name,
                    })}
                  />
                ))}
              <button
                type="submit"
                className="w-full bg-forest-green text-white font-semibold py-3 px-6 rounded-xl hover:bg-forest-green/90 transition-colors"
              >
                Add {selectedCount} bird{selectedCount !== 1 ? "s" : ""} &amp;
                start learning →
              </button>
            </form>
          ) : (
            <p className="text-center text-sm text-ink/40 py-2">
              Select at least 4 birds to continue
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
