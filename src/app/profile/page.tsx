import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { formatDateET } from "@/lib/date";
import { getMasteryStatus } from "@/lib/mastery";
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

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin");

  const [
    { data: profile },
    { data: listData },
    { data: sessionData },
    { data: questionData },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("life_list_entries")
      .select("species_code, common_name, mastery_score")
      .eq("user_id", user.id),
    supabase
      .from("quiz_sessions")
      .select("id")
      .eq("user_id", user.id)
      .not("completed_at", "is", null),
    supabase
      .from("quiz_questions")
      .select("species_code, question_type, is_correct")
      .not("is_correct", "is", null),
  ]);

  const lifeList = (listData as Pick<LifeListEntry, "species_code" | "common_name" | "mastery_score">[]) ?? [];
  const questions = (questionData ?? []) as QuestionRow[];
  const quizzesCompleted = sessionData?.length ?? 0;

  // Overall quiz accuracy
  const totalAnswered = questions.length;
  const totalCorrect = questions.filter((q) => q.is_correct).length;
  const overallAccuracy = totalAnswered > 0
    ? Math.round((totalCorrect / totalAnswered) * 100)
    : null;

  // Build stats map for mastery breakdown
  type TypeStats = { correct: number; total: number };
  const statsMap = new Map<string, { image: TypeStats; sound: TypeStats }>();
  for (const q of questions) {
    if (!statsMap.has(q.species_code)) {
      statsMap.set(q.species_code, {
        image: { correct: 0, total: 0 },
        sound: { correct: 0, total: 0 },
      });
    }
    const s = statsMap.get(q.species_code)!;
    if (q.question_type === "identify_by_image") {
      s.image.total++;
      if (q.is_correct) s.image.correct++;
    } else if (q.question_type === "identify_by_sound") {
      s.sound.total++;
      if (q.is_correct) s.sound.correct++;
    }
  }

  let masteredCount = 0;
  let learningCount = 0;
  let newCount = 0;
  for (const bird of lifeList) {
    const s = statsMap.get(bird.species_code) ?? {
      image: { correct: 0, total: 0 },
      sound: { correct: 0, total: 0 },
    };
    const status = getMasteryStatus(s.image, s.sound);
    if (status === "mastered") masteredCount++;
    else if (status === "learning") learningCount++;
    else newCount++;
  }

  const xp = profile?.total_xp ?? 0;
  const level = getLevel(xp);
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
  const levelPct = nextLevel
    ? Math.round(((xp - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  const memberSince = profile?.created_at
    ? formatDateET(new Date(profile.created_at), { month: "long", year: "numeric" })
    : null;

  const displayName =
    profile?.display_name || user.user_metadata?.display_name || "Birder";

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <section className="rounded-xl border border-ink/10 bg-white p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink">{displayName}</h1>
            <p className="text-sm text-ink/40 mt-0.5">{user.email}</p>
            {memberSince && (
              <p className="text-xs text-ink/30 mt-1">Member since {memberSince}</p>
            )}
          </div>
          {/* Avatar placeholder */}
          <div className="w-12 h-12 rounded-full bg-forest-green/10 flex items-center justify-center text-forest-green font-bold text-lg">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </section>

      {/* XP & Level */}
      <section className="rounded-xl border border-ink/10 bg-white p-5 mb-4">
        <h2 className="text-sm font-medium text-ink/60 mb-3">Level & XP</h2>
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-forest-green">{level.name}</span>
          <span className="text-sm text-ink/50">{xp.toLocaleString()} XP</span>
        </div>
        <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber rounded-full transition-all"
            style={{ width: `${levelPct}%` }}
          />
        </div>
        {nextLevel ? (
          <p className="text-xs text-ink/30 mt-1.5">
            {(nextLevel.min - xp).toLocaleString()} XP to {nextLevel.name}
          </p>
        ) : (
          <p className="text-xs text-ink/30 mt-1.5">Max level reached</p>
        )}

        {/* Streak stats */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-ink/5">
          <div>
            <p className="text-2xl font-bold text-amber">
              {profile?.current_streak ?? 0}
            </p>
            <p className="text-xs text-ink/40">day streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-ink/60">
              {profile?.longest_streak ?? 0}
            </p>
            <p className="text-xs text-ink/40">longest streak</p>
          </div>
        </div>
      </section>

      {/* Life List */}
      <section className="rounded-xl border border-ink/10 bg-white p-5 mb-4">
        <h2 className="text-sm font-medium text-ink/60 mb-3">Life List</h2>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-ink">{lifeList.length}</p>
            <p className="text-xs text-ink/40">total birds</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-forest-green">{masteredCount}</p>
            <p className="text-xs text-ink/40">mastered</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber">{learningCount}</p>
            <p className="text-xs text-ink/40">learning</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-danger">{newCount}</p>
            <p className="text-xs text-ink/40">new</p>
          </div>
        </div>
      </section>

      {/* Quiz Stats */}
      <section className="rounded-xl border border-ink/10 bg-white p-5 mb-4">
        <h2 className="text-sm font-medium text-ink/60 mb-3">Quiz Stats</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-ink">{quizzesCompleted}</p>
            <p className="text-xs text-ink/40">quizzes taken</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-ink">{totalAnswered.toLocaleString()}</p>
            <p className="text-xs text-ink/40">questions answered</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-ink">
              {overallAccuracy !== null ? `${overallAccuracy}%` : "—"}
            </p>
            <p className="text-xs text-ink/40">overall accuracy</p>
          </div>
        </div>
      </section>

      {/* Sign out */}
      <div className="pt-2 text-center">
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-danger font-medium hover:underline"
          >
            Sign Out
          </button>
        </form>
      </div>
    </main>
  );
}
