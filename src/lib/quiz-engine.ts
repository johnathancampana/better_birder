import type { LifeListEntry, SpeciesMastery, QuizQuestionType } from "@/types/database";
import { todayET } from "@/lib/date";

export type GeneratedQuestion = {
  question_type: QuizQuestionType;
  species_code: string;
  prompt: string;
  answer_options: string[];
  correct_answer: string;
  media_url?: string;
};

// Select which species to quiz on based on spaced repetition + mastery
export function selectQuizSpecies(
  entries: LifeListEntry[],
  masteries: SpeciesMastery[],
  count = 10
): LifeListEntry[] {
  const today = todayET();
  const masteryMap = new Map(masteries.map((m) => [m.species_code, m]));

  type Scored = { entry: LifeListEntry; priority: number };

  const scored: Scored[] = entries.map((entry) => {
    const m = masteryMap.get(entry.species_code);
    let priority = 0;

    if (m) {
      if (m.next_review_date <= today) priority += 100;
      if (m.mastery_score < 40) priority += 50;
      const daysSinceSeen = m.last_seen_in_quiz
        ? Math.floor(
            (Date.now() - new Date(m.last_seen_in_quiz).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 30;
      priority += Math.min(daysSinceSeen, 30);
    } else {
      priority += 80; // Never quizzed — high priority
    }

    priority += Math.random() * 20; // jitter
    return { entry, priority };
  });

  scored.sort((a, b) => b.priority - a.priority);
  return scored.slice(0, count).map((s) => s.entry);
}

function pickDistractors(
  target: LifeListEntry,
  allEntries: LifeListEntry[],
  count = 3
): LifeListEntry[] {
  const others = allEntries.filter(
    (e) => e.species_code !== target.species_code
  );
  return others.sort(() => Math.random() - 0.5).slice(0, count);
}

export function generateQuestions(
  species: LifeListEntry[],
  allEntries: LifeListEntry[],
  photoUrls: Map<string, string>,
  audioUrls: Map<string, string>
): GeneratedQuestion[] {
  // Alternate between image and sound questions where media is available,
  // enforcing no more than 5 of either type per session.
  const typeCounts = new Map<QuizQuestionType, number>([
    ["identify_by_image", 0],
    ["identify_by_sound", 0],
  ]);

  return species.flatMap((target) => {
    const hasPhoto = photoUrls.has(target.species_code);
    const hasAudio = audioUrls.has(target.species_code);

    // Build list of viable types for this question
    const viable: QuizQuestionType[] = [];
    if (hasPhoto && (typeCounts.get("identify_by_image") ?? 0) < 5)
      viable.push("identify_by_image");
    if (hasAudio && (typeCounts.get("identify_by_sound") ?? 0) < 5)
      viable.push("identify_by_sound");

    // Both type caps hit — relax the cap on whichever has media
    if (viable.length === 0) {
      if (hasPhoto) viable.push("identify_by_image");
      if (hasAudio) viable.push("identify_by_sound");
    }

    // Absolute last resort: skip this bird (caller filtered no-media birds,
    // so this should never happen, but guard anyway)
    if (viable.length === 0) return [];

    // Alternate types to keep the quiz varied
    const imageCount = typeCounts.get("identify_by_image") ?? 0;
    const soundCount = typeCounts.get("identify_by_sound") ?? 0;
    let questionType: QuizQuestionType;

    if (viable.length === 1) {
      questionType = viable[0];
    } else {
      // Pick whichever type has been used less so far
      questionType = imageCount <= soundCount ? "identify_by_image" : "identify_by_sound";
    }

    typeCounts.set(questionType, (typeCounts.get(questionType) ?? 0) + 1);

    const distractors = pickDistractors(target, allEntries);
    const options = [target, ...distractors]
      .map((e) => e.common_name)
      .sort(() => Math.random() - 0.5);

    const prompt =
      questionType === "identify_by_image"
        ? "Which bird is shown in this photo?"
        : "Which bird is making this sound?";

    const media_url =
      questionType === "identify_by_image"
        ? photoUrls.get(target.species_code)
        : audioUrls.get(target.species_code);

    return [{
      question_type: questionType,
      species_code: target.species_code,
      prompt,
      answer_options: options,
      correct_answer: target.common_name,
      media_url,
    }];
  });
}
