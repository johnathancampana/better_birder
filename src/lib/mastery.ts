export type MasteryStatus = "new" | "learning" | "mastered";
export type TypeStats = { correct: number; total: number };

const MIN_QUESTIONS = 10;
const MASTERED_RATE = 0.7;
const LEARNING_RATE = 0.4;

/**
 * Derives mastery status from per-type quiz stats.
 *
 * Mastered  — 70%+ correct AND 10+ questions in both sight and sound.
 * Learning  — 40–69% correct in both types, or fewer than 10 questions
 *             in either type (but not below 40% in either).
 * New       — never quizzed, or below 40% correct in either type.
 */
export function getMasteryStatus(
  image: TypeStats,
  sound: TypeStats
): MasteryStatus {
  if (image.total === 0 && sound.total === 0) return "new";

  const imageRate = image.total > 0 ? image.correct / image.total : null;
  const soundRate = sound.total > 0 ? sound.correct / sound.total : null;

  // Drop to New if either quizzed type is below the floor
  if (
    (imageRate !== null && imageRate < LEARNING_RATE) ||
    (soundRate !== null && soundRate < LEARNING_RATE)
  ) {
    return "new";
  }

  // Mastered requires both types to clear the bar with enough attempts
  const imageMastered =
    imageRate !== null && imageRate >= MASTERED_RATE && image.total >= MIN_QUESTIONS;
  const soundMastered =
    soundRate !== null && soundRate >= MASTERED_RATE && sound.total >= MIN_QUESTIONS;

  if (imageMastered && soundMastered) return "mastered";

  return "learning";
}

export function masteryStatusColor(status: MasteryStatus): string {
  if (status === "mastered") return "bg-forest-green/10 text-forest-green";
  if (status === "learning") return "bg-amber/20 text-amber";
  return "bg-danger/10 text-danger";
}

export function masteryBarColor(status: MasteryStatus): string {
  if (status === "mastered") return "bg-forest-green";
  if (status === "learning") return "bg-amber";
  return "bg-danger";
}

export function masteryLabel(status: MasteryStatus): string {
  if (status === "mastered") return "Mastered";
  if (status === "learning") return "Learning";
  return "New";
}
