"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  selectQuizSpecies,
  generateQuestions,
} from "@/lib/quiz-engine";
import { getBirdPhotoUrls, getBirdAudio } from "@/lib/macaulay";
import type { LifeListEntry, SpeciesMastery } from "@/types/database";
import { todayET } from "@/lib/date";

export async function startQuizSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin");

  // Fetch user's life list and masteries
  const [{ data: entries }, { data: masteries }] = await Promise.all([
    supabase
      .from("life_list_entries")
      .select("*")
      .eq("user_id", user.id),
    supabase
      .from("species_mastery")
      .select("*")
      .eq("user_id", user.id),
  ]);

  const lifeList = (entries as LifeListEntry[]) || [];
  const masteryList = (masteries as SpeciesMastery[]) || [];

  if (lifeList.length < 4) {
    redirect("/quiz?error=need-more-birds");
  }

  const questionCount = Math.min(10, lifeList.length);
  const selected = selectQuizSpecies(lifeList, masteryList, questionCount);

  // Fetch photos and audio for selected species in parallel
  const codes = selected.map((s) => s.species_code);
  const [photoUrls, audioEntries] = await Promise.all([
    getBirdPhotoUrls(codes),
    Promise.all(codes.map(async (code) => {
      const urls = await getBirdAudio(code, 1);
      return [code, urls[0] ?? null] as [string, string | null];
    })),
  ]);

  const audioUrls = new Map(
    audioEntries.filter(([, url]) => url !== null) as [string, string][]
  );

  // Drop birds with no media at all — they can't be quizzed on image or sound
  const quizzable = selected.filter(
    (s) => photoUrls.has(s.species_code) || audioUrls.has(s.species_code)
  );

  if (quizzable.length < 4) {
    redirect("/quiz?error=need-more-birds");
  }

  const questions = generateQuestions(quizzable, lifeList, photoUrls, audioUrls);

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from("quiz_sessions")
    .insert({ user_id: user.id })
    .select()
    .single();

  if (sessionError || !session) {
    throw new Error("Failed to create quiz session");
  }

  // Insert questions
  const { error: questionsError } = await supabase
    .from("quiz_questions")
    .insert(
      questions.map((q) => ({
        session_id: session.id,
        question_type: q.question_type,
        species_code: q.species_code,
        prompt: q.prompt,
        answer_options: q.answer_options,
        correct_answer: q.correct_answer,
        media_url: q.media_url ?? null,
      }))
    );

  if (questionsError) {
    throw new Error("Failed to create questions");
  }

  redirect(`/quiz/${session.id}`);
}

export async function submitAnswer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const questionId = formData.get("question_id") as string;
  const answer = formData.get("answer") as string;
  const correctAnswer = formData.get("correct_answer") as string;
  const speciesCode = formData.get("species_code") as string;
  const isCorrect = answer === correctAnswer;

  // Update question
  await supabase
    .from("quiz_questions")
    .update({
      user_answer: answer,
      is_correct: isCorrect,
    })
    .eq("id", questionId);

  // Update species mastery
  const { data: existing } = await supabase
    .from("species_mastery")
    .select("*")
    .eq("user_id", user.id)
    .eq("species_code", speciesCode)
    .single();

  const newTimesCorrect = (existing?.times_correct ?? 0) + (isCorrect ? 1 : 0);
  const newTimesSeen = (existing?.times_seen_in_quiz ?? 0) + 1;
  const newScore = Math.round((newTimesCorrect / newTimesSeen) * 100);

  // Calculate next review date (ET-anchored so it aligns with the user's day)
  let reviewDays = 1;
  if (newScore >= 70) reviewDays = 7;
  else if (newScore >= 40) reviewDays = 3;

  const nextReviewDate = new Date(todayET() + "T00:00:00");
  nextReviewDate.setDate(nextReviewDate.getDate() + reviewDays);
  const nextReview = nextReviewDate.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  await supabase.from("species_mastery").upsert(
    {
      user_id: user.id,
      species_code: speciesCode,
      times_seen_in_quiz: newTimesSeen,
      times_correct: newTimesCorrect,
      last_seen_in_quiz: new Date().toISOString(),
      mastery_score: newScore,
      next_review_date: nextReview,
    },
    { onConflict: "user_id,species_code" }
  );

  // Also update the mastery score on the life list entry
  await supabase
    .from("life_list_entries")
    .update({ mastery_score: newScore })
    .eq("user_id", user.id)
    .eq("species_code", speciesCode);

  return { isCorrect, correctAnswer };
}

export async function completeQuizSession(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const sessionId = formData.get("session_id") as string;

  // Calculate score
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("is_correct")
    .eq("session_id", sessionId);

  const total = questions?.length ?? 0;
  const correct = questions?.filter((q) => q.is_correct).length ?? 0;
  const xpEarned = correct * 10 + (total > 0 ? 20 : 0);

  await supabase
    .from("quiz_sessions")
    .update({
      completed_at: new Date().toISOString(),
      score: correct,
      xp_earned: xpEarned,
    })
    .eq("id", sessionId);

  // Update streak
  const today = todayET();
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak, longest_streak, last_activity_date, total_xp")
    .eq("id", user.id)
    .single();

  if (profile) {
    let newStreak = 1;
    if (profile.last_activity_date) {
      const lastDate = new Date(profile.last_activity_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 0) {
        newStreak = profile.current_streak;
      } else if (diffDays === 1) {
        newStreak = profile.current_streak + 1;
      }
    }

    await supabase
      .from("profiles")
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, profile.longest_streak),
        last_activity_date: today,
        total_xp: (profile.total_xp ?? 0) + xpEarned,
      })
      .eq("id", user.id);
  }

  redirect(`/quiz/${sessionId}/results`);
}
