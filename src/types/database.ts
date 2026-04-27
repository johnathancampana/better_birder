export type QuizQuestionType =
  | "identify_by_image"
  | "identify_by_sound"
  | "match_description"
  | "odd_one_out"
  | "range_question"
  | "fact_check";

export type User = {
  id: string;
  email: string;
  display_name: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  created_at: string;
};

export type LifeListEntry = {
  id: string;
  user_id: string;
  species_code: string;
  common_name: string;
  scientific_name: string;
  date_first_seen: string;
  location: string;
  notes: string;
  photo_url?: string;
  mastery_score: number;
  added_at: string;
};

export type QuizSession = {
  id: string;
  user_id: string;
  started_at: string;
  completed_at?: string;
  score: number;
  xp_earned: number;
};

export type QuizQuestion = {
  id: string;
  session_id: string;
  question_type: QuizQuestionType;
  species_code: string;
  prompt: string;
  answer_options: string[];
  correct_answer: string;
  user_answer?: string;
  is_correct?: boolean;
  time_spent_ms?: number;
  media_url?: string;
};

export type SpeciesMastery = {
  user_id: string;
  species_code: string;
  times_seen_in_quiz: number;
  times_correct: number;
  last_seen_in_quiz: string;
  mastery_score: number;
  next_review_date: string;
};
