"use client";

import { SUGGESTED_BIRDS } from "@/lib/suggested-birds";
import { BirdAddButton } from "./BirdAddButton";
import { BirdPhoto } from "./BirdPhoto";

export function SuggestedBirds({
  addedSpeciesCodes,
  photoUrls,
}: {
  addedSpeciesCodes: Set<string>;
  photoUrls: Record<string, string>;
}) {
  const suggestions = SUGGESTED_BIRDS.filter(
    (b) => !addedSpeciesCodes.has(b.species_code)
  );

  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-ink/40 text-center py-4">
        You&apos;ve added all suggested birds! Use search to find more.
      </p>
    );
  }

  const families = new Map<string, typeof suggestions>();
  for (const bird of suggestions) {
    const group = families.get(bird.family) || [];
    group.push(bird);
    families.set(bird.family, group);
  }

  return (
    <div className="space-y-4">
      {Array.from(families.entries()).map(([family, birds]) => (
        <div key={family}>
          <h3 className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-2">
            {family}
          </h3>
          <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/5 overflow-hidden">
            {birds.map((bird) => (
              <div
                key={bird.species_code}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <BirdPhoto
                  src={photoUrls[bird.species_code]}
                  alt={bird.common_name}
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {bird.common_name}
                  </p>
                  <p className="text-xs text-ink/40 truncate">
                    {bird.scientific_name}
                  </p>
                </div>
                <BirdAddButton bird={bird} isAdded={false} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
