import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { todayET } from "@/lib/date";
import { startQuizSession } from "./actions";

const BONUS_TITLES = [
  "Over-Achiever",
  "Back for More",
  "On a Roll",
  "Bonus Round",
  "Can't Stop, Won't Stop",
  "Extra Credit",
  "Feathered Fanatic",
  "Bird Nerd",

  "Unstoppable",
];

const BONUS_SUBTITLES: Record<string, string> = {
  "Over-Achiever":          "Daily goal? Already crushed. Keep the streak alive.",
  "Back for More":          "One quiz wasn't enough — good instinct.",
  "On a Roll":              "You're building some serious momentum today.",
  "Bonus Round":            "Extra practice, extra mastery. Let's go.",
  "Can't Stop, Won't Stop": "The birds aren't going to learn themselves.",
  "Extra Credit":           "Your life list is impressed.",
  "Feathered Fanatic":      "Certified bird enthusiast energy.",
  "Bird Nerd":              "Embrace it — bird nerds identify faster.",

  "Unstoppable":            "At this rate you'll be a Master Birder in no time.",
};

export default async function QuizLaunch({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let quizzedToday = false;

  if (user) {
    const { data: recentSessions } = await supabase
      .from("quiz_sessions")
      .select("completed_at")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5);

    quizzedToday = (recentSessions ?? []).some((s) => {
      if (!s.completed_at) return false;
      return (
        new Date(s.completed_at).toLocaleDateString("en-CA", {
          timeZone: "America/New_York",
        }) === todayET()
      );
    });
  }

  const bonusTitle =
    BONUS_TITLES[Math.floor(Math.random() * BONUS_TITLES.length)];
  const title = quizzedToday ? bonusTitle : "Daily Quiz";
  const subtitle = quizzedToday
    ? BONUS_SUBTITLES[bonusTitle]
    : "Test your knowledge on birds from your life list. Up to 10 questions, less than 5 minutes.";

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-bold text-forest-green mb-2">
          {title}
        </h1>
        <p className="text-ink/50 text-sm mb-6">{subtitle}</p>

        {error === "need-more-birds" && (
          <div className="bg-amber/10 text-amber text-sm rounded-lg p-3 mb-4">
            You need at least 4 birds on your life list to start a quiz.{" "}
            <Link href="/life-list" className="underline font-medium hover:opacity-80 transition-opacity">
              Add more birds →
            </Link>
          </div>
        )}

        <form action={startQuizSession}>
          <button
            type="submit"
            className="bg-forest-green text-white font-medium py-3 px-8 rounded-xl hover:bg-forest-green/90 transition-colors"
          >
            Start Quiz
          </button>
        </form>
      </div>
    </main>
  );
}
