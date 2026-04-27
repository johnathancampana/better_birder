import { startQuizSession } from "./actions";

export default async function QuizLaunch({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-bold text-forest-green mb-2">
          Daily Quiz
        </h1>
        <p className="text-ink/50 text-sm mb-6">
          Test your knowledge on birds from your life list. 10 questions, ~5
          minutes.
        </p>

        {error === "need-more-birds" && (
          <div className="bg-amber/10 text-amber text-sm rounded-lg p-3 mb-4">
            You need at least 4 birds on your life list to start a quiz.
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
