import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MasteryLegend } from "@/components/MasteryLegend";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { formatDateET, todayET } from "@/lib/date";
import { getMasteryStatus, type TypeStats } from "@/lib/mastery";
import { XPLegend } from "@/components/XPLegend";
import type { LifeListEntry } from "@/types/database";

const LEVELS = [
  { name: "Egg",           min: 0,    max: 99   },
  { name: "Hatchling",     min: 100,  max: 299  },
  { name: "Fledgling",     min: 300,  max: 699  },
  { name: "Songbird",      min: 700,  max: 1499 },
  { name: "Field Expert",  min: 1500, max: 2999 },
  { name: "Master Birder", min: 3000, max: Infinity },
];

function getLevel(xp: number) {
  return LEVELS.find((l) => xp >= l.min && xp <= l.max) ?? LEVELS[0];
}

type QuestionRow = {
  species_code: string;
  question_type: string;
  is_correct: boolean;
};

type SpeciesStats = { image: TypeStats; sound: TypeStats };

function buildStatsMap(questions: QuestionRow[]): Map<string, SpeciesStats> {
  const map = new Map<string, SpeciesStats>();
  for (const q of questions) {
    if (!map.has(q.species_code)) {
      map.set(q.species_code, {
        image: { correct: 0, total: 0 },
        sound: { correct: 0, total: 0 },
      });
    }
    const stats = map.get(q.species_code)!;
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

function ProgressBar({
  mastered,
  learning,
  newCount,
  total,
}: {
  mastered: number;
  learning: number;
  newCount: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="text-center text-sm text-ink/40 py-4">
        Add birds to your life list to see progress stats.
      </div>
    );
  }

  const masteredPct = Math.round((mastered / total) * 100);
  const learningPct = Math.round((learning / total) * 100);
  const newPct = 100 - masteredPct - learningPct;

  return (
    <div>
      <div className="flex h-4 rounded-full overflow-hidden bg-ink/5">
        {masteredPct > 0 && (
          <div className="bg-forest-green" style={{ width: `${masteredPct}%` }} />
        )}
        {learningPct > 0 && (
          <div className="bg-amber" style={{ width: `${learningPct}%` }} />
        )}
        {newPct > 0 && (
          <div className="bg-danger" style={{ width: `${newPct}%` }} />
        )}
      </div>
      <div className="flex flex-col gap-1 mt-2 text-xs text-ink/50">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-forest-green" />
          Mastered ({mastered})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber" />
          Learning ({learning})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-danger" />
          New ({newCount})
        </span>
      </div>
    </div>
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ onboarded?: string }>;
}) {
  const { onboarded } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin");

  // Check life list first — redirect to onboarding before fetching anything else
  const { data: entries } = await supabase
    .from("life_list_entries")
    .select("species_code, common_name, mastery_score")
    .eq("user_id", user.id);

  const lifeList =
    (entries as Pick<
      LifeListEntry,
      "species_code" | "common_name" | "mastery_score"
    >[]) || [];

  if (lifeList.length === 0) redirect("/onboarding");

  const [{ data: profile }, { data: questionData }, { data: recentSessions }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("quiz_questions")
        .select("species_code, question_type, is_correct")
        .not("is_correct", "is", null),
      supabase
        .from("quiz_sessions")
        .select("completed_at")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(5),
    ]);

  const quizzedToday = (recentSessions ?? []).some((s) => {
    if (!s.completed_at) return false;
    return (
      new Date(s.completed_at).toLocaleDateString("en-CA", {
        timeZone: "America/New_York",
      }) === todayET()
    );
  });

  const statsMap = buildStatsMap((questionData ?? []) as QuestionRow[]);

  // Categorise each bird using the real mastery definition
  let masteredCount = 0;
  let learningCount = 0;
  let newCount = 0;

  for (const bird of lifeList) {
    const stats = statsMap.get(bird.species_code) ?? {
      image: { correct: 0, total: 0 },
      sound: { correct: 0, total: 0 },
    };
    const status = getMasteryStatus(stats.image, stats.sound);
    if (status === "mastered") masteredCount++;
    else if (status === "learning") learningCount++;
    else newCount++;
  }

  // Need Practice: birds not yet mastered, sorted by lowest overall correct rate
  const struggling = [...lifeList]
    .filter((b) => {
      const stats = statsMap.get(b.species_code) ?? {
        image: { correct: 0, total: 0 },
        sound: { correct: 0, total: 0 },
      };
      return getMasteryStatus(stats.image, stats.sound) !== "mastered";
    })
    .sort((a, b) => a.mastery_score - b.mastery_score)
    .slice(0, 5);

  const mastered = lifeList.filter((b) => {
    const stats = statsMap.get(b.species_code) ?? {
      image: { correct: 0, total: 0 },
      sound: { correct: 0, total: 0 },
    };
    return getMasteryStatus(stats.image, stats.sound) === "mastered";
  });

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-forest-green mb-6">Dashboard</h1>
      {onboarded === "1" && <WelcomeBanner />}

      {/* Streak card */}
      <section className="rounded-xl border border-ink/10 bg-white p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-amber">
              {profile?.current_streak ?? 0}
            </p>
            <p className="text-xs text-ink/40">day streak</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-ink/60">
              Longest: {profile?.longest_streak ?? 0}
            </p>
            {profile?.last_activity_date && (
              <p className="text-xs text-ink/30 mt-0.5">
                {profile.last_activity_date === todayET()
                  ? "Last active Today"
                  : `Last active ${formatDateET(profile.last_activity_date, {
                      month: "short",
                      day: "numeric",
                    })}`}
              </p>
            )}
          </div>
        </div>

        {/* XP & level */}
        {(() => {
          const xp = profile?.total_xp ?? 0;
          const level = getLevel(xp);
          const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
          const pct = nextLevel
            ? Math.round(((xp - level.min) / (nextLevel.min - level.min)) * 100)
            : 100;
          return (
            <div className="mt-4 pt-4 border-t border-ink/5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-ink/60">{level.name}</span>
                <span className="text-xs text-ink/40">
                  {xp.toLocaleString()} XP
                  {nextLevel && (
                    <span className="text-ink/30"> · {nextLevel.min.toLocaleString()} to {nextLevel.name}</span>
                  )}
                </span>
              </div>
              <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}
        <XPLegend />
      </section>

      {/* Progress overview */}
      <section className="rounded-xl border border-ink/10 bg-white p-5 mb-4">
        <h2 className="text-sm font-medium text-ink/60">
          Progress Overview ({lifeList.length} birds)
        </h2>
        <div className="mt-3">
          <ProgressBar
            mastered={masteredCount}
            learning={learningCount}
            newCount={newCount}
            total={lifeList.length}
          />
        </div>
        <MasteryLegend />
      </section>

      {/* Need practice */}
      {struggling.length > 0 && (
        <section className="rounded-xl border border-ink/10 bg-white p-5 mb-4">
          <h2 className="text-sm font-medium text-ink/60 mb-3">Need Practice</h2>
          <div className="space-y-2">
            {struggling.map((bird) => (
              <div key={bird.species_code} className="flex items-center justify-between">
                <Link
                  href={`/life-list/${bird.species_code}`}
                  className="text-sm hover:text-forest-green transition-colors"
                >
                  {bird.common_name}
                </Link>
                <span className="text-xs text-ink/40">{bird.mastery_score}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mastered */}
      {mastered.length > 0 && (
        <section className="rounded-xl border border-ink/10 bg-white p-5 mb-4">
          <h2 className="text-sm font-medium text-ink/60 mb-3">Mastered</h2>
          <div className="flex flex-wrap gap-2">
            {mastered.map((bird) => (
              <Link
                key={bird.species_code}
                href={`/life-list/${bird.species_code}`}
                className="text-xs bg-forest-green/10 text-forest-green px-3 py-1.5 rounded-full hover:bg-forest-green/20 transition-colors"
              >
                {bird.common_name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="text-center pt-2">
        <Link
          href="/quiz"
          className="inline-block bg-forest-green text-white font-medium py-3 px-8 rounded-xl hover:bg-forest-green/90 transition-colors"
        >
          {quizzedToday ? "Take Another Quiz" : "Start Today\u2019s Quiz"}
        </Link>
        {quizzedToday && (
          <p className="text-xs text-ink/40 mt-2">
            ✓ Daily goal complete — take another quiz to earn more XP
          </p>
        )}
      </div>
    </main>
  );
}
