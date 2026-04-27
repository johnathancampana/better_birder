"use client";

import Link from "next/link";
import { BirdAddButton } from "./BirdAddButton";
import { BirdPhoto } from "./BirdPhoto";
import { getMasteryStatus, masteryStatusColor, masteryLabel } from "@/lib/mastery";
import type { SpeciesStatsMap } from "@/app/life-list/page";
import type { LifeListEntry } from "@/types/database";

export function LifeListGrid({
  entries,
  photoUrls,
  statsMap,
}: {
  entries: LifeListEntry[];
  photoUrls: Record<string, string>;
  statsMap: SpeciesStatsMap;
}) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-ink/40 text-sm">
          Your life list is empty. Add birds from the suggestions below or use
          search!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {entries.map((entry) => {
        const stats = statsMap[entry.species_code] ?? {
          image: { correct: 0, total: 0 },
          sound: { correct: 0, total: 0 },
        };
        const status = getMasteryStatus(stats.image, stats.sound);

        return (
          <div
            key={entry.species_code}
            className="rounded-xl border border-ink/10 bg-white p-3 flex items-center gap-3"
          >
            <Link href={`/life-list/${entry.species_code}`} className="shrink-0">
              <BirdPhoto
                src={photoUrls[entry.species_code]}
                alt={entry.common_name}
                size={48}
              />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Link
                  href={`/life-list/${entry.species_code}`}
                  className="text-sm font-medium truncate hover:text-forest-green transition-colors"
                >
                  {entry.common_name}
                </Link>
                <span
                  className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${masteryStatusColor(status)}`}
                >
                  {masteryLabel(status)}
                </span>
              </div>
              <p className="text-xs text-ink/40 truncate">
                {entry.scientific_name}
              </p>
            </div>
            <BirdAddButton
              bird={{
                species_code: entry.species_code,
                common_name: entry.common_name,
                scientific_name: entry.scientific_name,
              }}
              isAdded={true}
            />
          </div>
        );
      })}
    </div>
  );
}
