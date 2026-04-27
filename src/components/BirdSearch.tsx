"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { searchEbirdSpecies } from "@/app/life-list/actions";
import { BirdAddButton } from "./BirdAddButton";
import { BirdPhoto } from "./BirdPhoto";

type SearchResult = {
  species_code: string;
  common_name: string;
  scientific_name: string;
  family: string;
};

export function BirdSearch({
  addedSpeciesCodes,
  photoUrls,
}: {
  addedSpeciesCodes: Set<string>;
  photoUrls: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchEbirdSpecies(query);
        setResults(data);
      });
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search birds by name..."
          className="w-full rounded-xl border border-ink/10 px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green/30"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-2 rounded-xl border border-ink/10 bg-white divide-y divide-ink/5 overflow-hidden">
          {results.map((bird) => {
            const isAdded = addedSpeciesCodes.has(bird.species_code);
            return (
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
                    {bird.scientific_name} · {bird.family}
                  </p>
                </div>
                <BirdAddButton bird={bird} isAdded={isAdded} />
              </div>
            );
          })}
        </div>
      )}

      {query.length >= 2 && !isPending && results.length === 0 && (
        <p className="mt-3 text-sm text-ink/40 text-center">
          No birds found for &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  );
}
