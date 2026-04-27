"use client";

import { useState } from "react";

export function BirdPhoto({
  src,
  alt,
  size = 48,
}: {
  src?: string | null;
  alt: string;
  size?: number;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className="shrink-0 rounded-lg bg-forest-green/5 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          className="w-5 h-5 text-forest-green/20"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6c-3 0-6 3-6 6s6 8 6 8 6-5 6-8-3-6-6-6z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setError(true)}
      className="shrink-0 rounded-lg object-cover"
      style={{ width: size, height: size }}
    />
  );
}
