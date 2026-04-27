const PHOTO_CACHE = new Map<string, string | null>();

function assetPhotoUrl(assetId: string | number) {
  return `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${assetId}/1200`;
}

function assetAudioUrl(assetId: string | number) {
  return `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${assetId}`;
}

async function searchMacaulay(
  speciesCode: string,
  mediaType: "Photo" | "Audio",
  count: number
): Promise<Array<{ assetId: string; url: string }>> {
  try {
    const url =
      `https://search.macaulaylibrary.org/api/v1/search` +
      `?taxonCode=${speciesCode}` +
      `&mediaType=${mediaType}` +
      `&sort=rating_rank_desc` +
      `&count=${count}`;

    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return [];

    const data = await res.json();

    // Macaulay returns: { results: { content: [...] } }
    const content =
      data?.results?.content ??
      data?.content ??
      (Array.isArray(data) ? data : null);

    if (!Array.isArray(content) || content.length === 0) return [];

    return content
      .map((r: Record<string, unknown>) => {
        const id = (r.assetId ?? r.catalogId) as string | number | undefined;
        if (!id) return null;
        return {
          assetId: String(id),
          url: mediaType === "Photo" ? assetPhotoUrl(id) : assetAudioUrl(id),
        };
      })
      .filter((r): r is { assetId: string; url: string } => r !== null);
  } catch {
    return [];
  }
}

export async function getBirdPhotoUrl(
  speciesCode: string
): Promise<string | null> {
  if (PHOTO_CACHE.has(speciesCode)) {
    return PHOTO_CACHE.get(speciesCode) ?? null;
  }

  const results = await searchMacaulay(speciesCode, "Photo", 1);
  const url = results[0]?.url ?? null;
  PHOTO_CACHE.set(speciesCode, url);
  return url;
}

export async function getBirdPhotoUrls(
  speciesCodes: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await Promise.all(
    speciesCodes.map(async (code) => {
      const url = await getBirdPhotoUrl(code);
      if (url) map.set(code, url);
    })
  );
  return map;
}

export async function getBirdPhotos(
  speciesCode: string,
  count = 5
): Promise<string[]> {
  const results = await searchMacaulay(speciesCode, "Photo", count);
  return results.map((r) => r.url);
}

export async function getBirdAudio(
  speciesCode: string,
  count = 3
): Promise<string[]> {
  const results = await searchMacaulay(speciesCode, "Audio", count);
  return results.map((r) => r.url);
}
