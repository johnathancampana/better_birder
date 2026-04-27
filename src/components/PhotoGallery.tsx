"use client";

import { useState } from "react";

export function PhotoGallery({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<Set<number>>(new Set());

  const validPhotos = photos.filter((_, i) => !error.has(i));

  if (validPhotos.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-forest-green/5 rounded-xl flex items-center justify-center">
        <p className="text-sm text-ink/30">No photos available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-ink/5">
        <img
          src={photos[activeIndex]}
          alt={`${alt} — photo ${activeIndex + 1}`}
          className="w-full h-full object-cover"
          onError={() => {
            setError((prev) => new Set(prev).add(activeIndex));
            const next = photos.findIndex((_, i) => i !== activeIndex && !error.has(i));
            if (next !== -1) setActiveIndex(next);
          }}
        />
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {photos.map((photo, i) =>
            error.has(i) ? null : (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === activeIndex
                    ? "border-forest-green"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={photo}
                  alt={`${alt} thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
