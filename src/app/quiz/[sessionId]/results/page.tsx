import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMasteryStatus, masteryLabel, type TypeStats } from "@/lib/mastery";
import { todayET } from "@/lib/date";

type FullQuestion = {
  id: string;
  session_id: string;
  question_type: string;
  species_code: string;
  correct_answer: string;
  user_answer?: string;
  is_correct?: boolean;
};

type SlimQuestion = {
  species_code: string;
  question_type: string;
  is_correct: boolean;
  session_id: string;
};

function buildStatsMap(
  questions: SlimQuestion[]
): Map<string, { image: TypeStats; sound: TypeStats }> {
  const map = new Map<string, { image: TypeStats; sound: TypeStats }>();
  for (const q of questions) {
    if (!map.has(q.species_code)) {
      map.set(q.species_code, {
        image: { correct: 0, total: 0 },
        sound: { correct: 0, total: 0 },
      });
    }
    const s = map.get(q.species_code)!;
    if (q.question_type === "identify_by_image") {
      s.image.total++;
      if (q.is_correct) s.image.correct++;
    } else if (q.question_type === "identify_by_sound") {
      s.sound.total++;
      if (q.is_correct) s.sound.correct++;
    }
  }
  return map;
}

const EMPTY_STATS = { image: { correct: 0, total: 0 }, sound: { correct: 0, total: 0 } };

export default async function QuizResults({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin");

  const [
    { data: session },
    { data: sessionQuestionsRaw },
    { data: profile },
    { data: allQuestionsRaw },
    { data: recentSessions },
  ] = await Promise.all([
    supabase
      .from("quiz_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("quiz_questions")
      .select("id, session_id, question_type, species_code, correct_answer, user_answer, is_correct")
      .eq("session_id", sessionId)
      .order("id"),
    supabase
      .from("profiles")
      .select("current_streak, longest_streak")
      .eq("id", user.id)
      .single(),
    supabase
      .from("quiz_questions")
      .select("species_code, question_type, is_correct, session_id")
      .not("is_correct", "is", null),
    supabase
      .from("quiz_sessions")
      .select("id, completed_at")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(10),
  ]);

  if (!session) redirect("/quiz");

  const questions = (sessionQuestionsRaw ?? []) as FullQuestion[];
  const allQ = (allQuestionsRaw ?? []) as SlimQuestion[];

  const total = questions.length;
  const correct = questions.filter((q) => q.is_correct).length;
  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Score color — use full class strings so Tailwind doesn't purge them
  const scoreBorder =
    scorePercent >= 80 ? "border-forest-green" : scorePercent >= 50 ? "border-amber" : "border-danger";
  const scoreText =
    scorePercent >= 80 ? "text-forest-green" : scorePercent >= 50 ? "text-amber" : "text-danger";
  const scoreHeadline =
    scorePercent >= 80 ? "Great job!" : scorePercent >= 50 ? "Nice effort!" : "Keep practicing!";

  const totalXp = session.xp_earned ?? 0;

  // Mastery movement — compare each species' status before vs. after this session
  const sessionSpecies = [...new Set(questions.map((q) => q.species_code))];
  const masteryChanges = sessionSpecies
    .map((code) => {
      const beforeQ = allQ.filter((q) => q.session_id !== sessionId && q.species_code === code);
      const afterQ  = allQ.filter((q) => q.species_code === code);

      const beforeStats = buildStatsMap(beforeQ).get(code) ?? EMPTY_STATS;
      const afterStats  = buildStatsMap(afterQ).get(code)  ?? EMPTY_STATS;

      const before = getMasteryStatus(beforeStats.image, beforeStats.sound);
      const after  = getMasteryStatus(afterStats.image,  afterStats.sound);

      if (before === after) return null;

      const birdName =
        questions.find((q) => q.species_code === code)?.correct_answer ?? code;
      return { code, birdName, before, after };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const streak = profile?.current_streak ?? 0;
  const isPersonalBest =
    streak > 0 && profile?.longest_streak != null && streak >= profile.longest_streak;

  // Only show the streak callout if this was the first completed quiz today
  // (i.e. the one that actually extended the streak)
  const today = todayET();
  const completedTodayCount = (recentSessions ?? []).filter(
    (s) =>
      s.completed_at &&
      new Date(s.completed_at).toLocaleDateString("en-CA", {
        timeZone: "America/New_York",
      }) === today
  ).length;
  const showStreakCallout = streak > 0 && completedTodayCount === 1;

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto">

      {/* Score hero */}
      <div className="text-center mb-6">
        <div
          className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${scoreBorder} mb-4`}
        >
          <div>
            <p className={`text-4xl font-bold ${scoreText}`}>
              {correct}/{total}
            </p>
            <p className="text-xs text-ink/40">{scorePercent}%</p>
          </div>
        </div>
        <h1 className="text-xl font-bold text-ink">{scoreHeadline}</h1>
        <p className="text-sm text-amber font-medium mt-1">+{totalXp} XP</p>
      </div>

      {/* Streak callout — first quiz of the day only */}
      {showStreakCallout && (
        <div className="rounded-xl border border-amber/30 bg-amber/5 p-4 text-center mb-4">
          <p className="text-2xl font-bold text-amber">🔥 {streak}-day streak!</p>
          {isPersonalBest && (
            <p className="text-xs text-ink/40 mt-1">Personal best!</p>
          )}
        </div>
      )}

      {/* Mastery movement */}
      {masteryChanges.length > 0 && (
        <section className="rounded-xl border border-ink/10 bg-white p-5 mb-4">
          <h2 className="text-sm font-medium text-ink/60 mb-3">Mastery Changes</h2>
          <div className="space-y-2">
            {masteryChanges.map((change) => (
              <div key={change.code} className="flex items-center justify-between">
                <span className="text-sm font-medium">{change.birdName}</span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="text-ink/40">{masteryLabel(change.before)}</span>
                  <span className="text-ink/30">→</span>
                  <span
                    className={
                      change.after === "mastered"
                        ? "text-forest-green font-medium"
                        : change.after === "learning"
                          ? "text-amber font-medium"
                          : "text-danger font-medium"
                    }
                  >
                    {masteryLabel(change.after)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Per-question recap */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-ink/60 mb-3">Question Recap</h2>
        <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/5 overflow-hidden">
          {questions.map((q) => (
            <div key={q.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    q.is_correct
                      ? "bg-forest-green/10 text-forest-green"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  {q.is_correct ? "✓" : "✗"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{q.correct_answer}</p>
                  {!q.is_correct && (
                    <p className="text-xs text-ink/40 mt-0.5">
                      You answered: {q.user_answer}
                    </p>
                  )}
                </div>
              </div>
              <span className="flex-shrink-0 text-xs text-ink/30 mt-0.5">
                {q.question_type === "identify_by_image" ? "Sight" : "Sound"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3 text-center">
        <Link
          href="/quiz"
          className="bg-forest-green text-white font-medium py-3 px-8 rounded-xl hover:bg-forest-green/90 transition-colors"
        >
          Take Another Quiz
        </Link>
        <Link
          href="/dashboard"
          className="text-forest-green font-medium py-3 px-8 rounded-xl border border-forest-green/20 hover:bg-forest-green/5 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
