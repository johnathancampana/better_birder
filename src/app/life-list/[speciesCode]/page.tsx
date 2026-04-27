import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBirdPhotos, getBirdAudio } from "@/lib/macaulay";
import { PhotoGallery } from "@/components/PhotoGallery";
import { AudioPlayer } from "@/components/AudioPlayer";
import { getMasteryStatus, masteryStatusColor, masteryLabel } from "@/lib/mastery";
import type { LifeListEntry } from "@/types/database";

type QuestionRow = { question_type: string; is_correct: boolean | null };

function typeStat(questions: QuestionRow[], type: string) {
  const rows = questions.filter(
    (q) => q.question_type === type && q.is_correct !== null
  );
  return { correct: rows.filter((q) => q.is_correct).length, total: rows.length };
}

export default async function BirdDetail({
  params,
}: {
  params: Promise<{ speciesCode: string }>;
}) {
  const { speciesCode } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [photosResult, audioResult, entryResult, questionsResult] =
    await Promise.all([
      getBirdPhotos(speciesCode, 5),
      getBirdAudio(speciesCode, 3),
      user
        ? supabase
            .from("life_list_entries")
            .select("*")
            .eq("user_id", user.id)
            .eq("species_code", speciesCode)
            .single()
        : Promise.resolve({ data: null }),
      user
        ? supabase
            .from("quiz_questions")
            .select("question_type, is_correct")
            .eq("species_code", speciesCode)
            .not("is_correct", "is", null)
        : Promise.resolve({ data: [] }),
    ]);

  const entry = entryResult.data as LifeListEntry | null;
  const photos = photosResult;
  const audio = audioResult;
  const questions = (questionsResult.data ?? []) as QuestionRow[];

  const sight = typeStat(questions, "identify_by_image");
  const sound = typeStat(questions, "identify_by_sound");
  const hasQuizData = sight.total > 0 || sound.total > 0;
  const status = getMasteryStatus(sight, sound);

  const birdName = entry?.common_name ?? speciesCode;
  const scientificName = entry?.scientific_name ?? "";

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <Link
        href="/life-list"
        className="inline-flex items-center gap-1 text-sm text-ink/40 hover:text-ink/60 mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Life List
      </Link>

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-forest-green">{birdName}</h1>
          {hasQuizData ? (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${masteryStatusColor(status)}`}>
              {masteryLabel(status)}
            </span>
          ) : (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-ink/5 text-ink/30">
              Not yet quizzed
            </span>
          )}
        </div>
        {scientificName && (
          <p className="text-sm text-ink/40 italic mt-1">{scientificName}</p>
        )}
      </div>

      {/* Photo gallery */}
      <section className="mb-6">
        <PhotoGallery photos={photos} alt={birdName} />
      </section>

      {/* Audio */}
      {audio.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-ink/60 mb-3">Songs & Calls</h2>
          <div className="flex flex-col gap-2">
            {audio.map((url, i) => (
              <AudioPlayer
                key={url}
                src={url}
                label={i === 0 ? "Primary song" : `Call ${i}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quiz performance */}
      {hasQuizData && (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-ink/60 mb-3">Quiz Performance</h2>
          <div className="flex flex-col gap-2">
            {sight.total > 0 && (
              <div className="rounded-xl border border-ink/10 bg-white px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-ink/60">Sight identification</span>
                <span className="text-sm font-semibold">
                  <span className="text-forest-green">{sight.correct}</span>
                  <span className="text-ink/30"> / {sight.total}</span>
                </span>
              </div>
            )}
            {sound.total > 0 && (
              <div className="rounded-xl border border-ink/10 bg-white px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-ink/60">Sound identification</span>
                <span className="text-sm font-semibold">
                  <span className="text-forest-green">{sound.correct}</span>
                  <span className="text-ink/30"> / {sound.total}</span>
                </span>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
