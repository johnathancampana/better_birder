import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const [{ data: session }, { data: questions }, { data: profile }] =
    await Promise.all([
      supabase
        .from("quiz_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("quiz_questions")
        .select("*")
        .eq("session_id", sessionId)
        .order("id"),
      supabase
        .from("profiles")
        .select("current_streak, longest_streak")
        .eq("id", user.id)
        .single(),
    ]);

  if (!session) redirect("/quiz");

  const total = questions?.length ?? 0;
  const correct = questions?.filter((q) => q.is_correct).length ?? 0;
  const missed = questions?.filter((q) => !q.is_correct) ?? [];
  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      {/* Score */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-forest-green mb-4">
          <div>
            <p className="text-3xl font-bold text-forest-green">
              {correct}/{total}
            </p>
            <p className="text-xs text-ink/40">{scorePercent}%</p>
          </div>
        </div>
        <h1 className="text-xl font-bold text-forest-green">
          {scorePercent >= 80
            ? "Great job!"
            : scorePercent >= 50
              ? "Nice effort!"
              : "Keep practicing!"}
        </h1>
        <p className="text-sm text-ink/50 mt-1">
          +{session.xp_earned} XP earned
        </p>
      </div>

      {/* Streak */}
      {profile && profile.current_streak > 0 && (
        <div className="rounded-xl border border-amber/30 bg-amber/5 p-4 text-center mb-6">
          <p className="text-2xl font-bold text-amber">
            {profile.current_streak} day streak
          </p>
          <p className="text-xs text-ink/40 mt-1">
            Longest: {profile.longest_streak} days
          </p>
        </div>
      )}

      {/* Missed birds */}
      {missed.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-ink/60 mb-3">
            Birds to Review
          </h2>
          <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/5 overflow-hidden">
            {missed.map((q) => (
              <div key={q.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{q.correct_answer}</p>
                    <p className="text-xs text-ink/40">
                      You answered: {q.user_answer}
                    </p>
                  </div>
                  <Link
                    href={`/life-list/${q.species_code}`}
                    className="text-xs text-forest-green font-medium hover:underline"
                  >
                    Study
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All questions breakdown */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-ink/60 mb-3">All Questions</h2>
        <div className="flex gap-1.5 flex-wrap">
          {questions?.map((q, i) => (
            <div
              key={q.id}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                q.is_correct
                  ? "bg-forest-green/10 text-forest-green"
                  : "bg-danger/10 text-danger"
              }`}
              title={`Q${i + 1}: ${q.correct_answer}`}
            >
              {i + 1}
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
