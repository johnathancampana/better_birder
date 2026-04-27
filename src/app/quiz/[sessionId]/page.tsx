import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuizPlayer } from "@/components/QuizPlayer";

export default async function QuizSession({
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

  const { data: session } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) redirect("/quiz");

  // If already completed, go to results
  if (session.completed_at) {
    redirect(`/quiz/${sessionId}/results`);
  }

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("session_id", sessionId)
    .order("id");

  return (
    <main className="min-h-screen px-4 py-8">
      <QuizPlayer sessionId={sessionId} questions={questions ?? []} />
    </main>
  );
}
