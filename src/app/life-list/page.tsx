import { createClient } from "@/lib/supabase/server";
import { LifeListGrid } from "@/components/LifeListGrid";
import { BirdSearch } from "@/components/BirdSearch";
import { SuggestedBirds } from "@/components/SuggestedBirds";
import { getBirdPhotoUrls } from "@/lib/macaulay";
import { SUGGESTED_BIRDS } from "@/lib/suggested-birds";
import type { TypeStats } from "@/lib/mastery";
import type { LifeListEntry } from "@/types/database";

type QuestionRow = {
  species_code: string;
  question_type: string;
  is_correct: boolean;
};

export type SpeciesStatsMap = Record<string, { image: TypeStats; sound: TypeStats }>;

function buildStatsMap(questions: QuestionRow[]): SpeciesStatsMap {
  const map: SpeciesStatsMap = {};
  for (const q of questions) {
    if (!map[q.species_code]) {
      map[q.species_code] = {
        image: { correct: 0, total: 0 },
        sound: { correct: 0, total: 0 },
      };
    }
    const stats = map[q.species_code];
    if (q.question_type === "identify_by_image") {
      stats.image.total++;
      if (q.is_correct) stats.image.correct++;
    } else if (q.question_type === "identify_by_sound") {
      stats.sound.total++;
      if (q.is_correct) stats.sound.correct++;
    }
  }
  return map;
}

export default async function LifeList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let entries: LifeListEntry[] = [];
  let statsMap: SpeciesStatsMap = {};

  if (user) {
    const [{ data: listData }, { data: questionData }] = await Promise.all([
      supabase
        .from("life_list_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false }),
      supabase
        .from("quiz_questions")
        .select("species_code, question_type, is_correct")
        .not("is_correct", "is", null),
    ]);
    entries = (listData as LifeListEntry[]) || [];
    statsMap = buildStatsMap((questionData ?? []) as QuestionRow[]);
  }

  const addedSpeciesCodes = new Set(entries.map((e) => e.species_code));

  // Fetch photos for life list birds + first batch of suggested birds
  const suggestedNotAdded = SUGGESTED_BIRDS.filter(
    (b) => !addedSpeciesCodes.has(b.species_code)
  ).slice(0, 20);

  const allCodesToFetch = [
    ...entries.map((e) => e.species_code),
    ...suggestedNotAdded.map((b) => b.species_code),
  ];

  const photoUrls = await getBirdPhotoUrls(allCodesToFetch);
  const photoMap = Object.fromEntries(photoUrls);

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-forest-green">
          Your Life List
        </h1>
        <p className="text-sm text-ink/50 mt-1">
          {entries.length === 0
            ? "Start building your list — add birds you've identified!"
            : `${entries.length} bird${entries.length === 1 ? "" : "s"} on your list`}
        </p>
      </div>

      {/* Search */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-ink/60 mb-3">Search</h2>
        <BirdSearch addedSpeciesCodes={addedSpeciesCodes} photoUrls={photoMap} />
      </section>

      {/* Life list */}
      {entries.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-ink/60 mb-3">Your Birds</h2>
          <LifeListGrid entries={entries} photoUrls={photoMap} statsMap={statsMap} />
        </section>
      )}

      {/* Suggested */}
      <section>
        <h2 className="text-sm font-medium text-ink/60 mb-3">
          Suggested — Common in the Northeast U.S.
        </h2>
        <SuggestedBirds
          addedSpeciesCodes={addedSpeciesCodes}
          photoUrls={photoMap}
        />
      </section>
    </main>
  );
}
