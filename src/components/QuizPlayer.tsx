"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { submitAnswer, completeQuizSession } from "@/app/quiz/actions";

type Question = {
  id: string;
  question_type: string;
  species_code: string;
  prompt: string;
  answer_options: string[];
  correct_answer: string;
  media_url?: string | null;
  user_answer?: string | null;
  is_correct?: boolean | null;
};

function SoundPlayer({ src, revealed, answered }: { src: string; revealed: boolean; answered: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (answered && audioRef.current) {
      audioRef.current.pause();
    }
  }, [answered]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play();
    }
    setPlaying(!playing);
  }

  return (
    <div className="mb-6 flex flex-col items-center gap-3">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
      <button
        onClick={toggle}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          playing
            ? "bg-forest-green text-white scale-105"
            : "bg-forest-green/10 text-forest-green hover:bg-forest-green/20"
        }`}
        aria-label={playing ? "Pause" : "Play bird sound"}
      >
        {playing ? (
          <>
            <span className="absolute w-20 h-20 rounded-full bg-forest-green/20 animate-ping" />
            <svg className="w-8 h-8 relative" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </>
        ) : (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <p className="text-xs text-ink/40">
        {revealed ? "Bird sound" : "Tap to play — listen carefully"}
      </p>
    </div>
  );
}

export function QuizPlayer({
  sessionId,
  questions,
}: {
  sessionId: string;
  questions: Question[];
}) {
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, questions.findIndex((q) => !q.user_answer))
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = questions.filter((q) => q.user_answer).length;
  const isSound = question?.question_type === "identify_by_sound";
  const isImage = question?.question_type === "identify_by_image";

  if (!question) return null;

  function handleSelect(answer: string) {
    if (result || isPending) return;
    setSelectedAnswer(answer);

    const formData = new FormData();
    formData.set("question_id", question.id);
    formData.set("answer", answer);
    formData.set("correct_answer", question.correct_answer);
    formData.set("species_code", question.species_code);

    startTransition(async () => {
      const res = await submitAnswer(formData);
      setResult(res);
    });
  }

  function handleNext() {
    setSelectedAnswer(null);
    setResult(null);
    setCurrentIndex((i) => i + 1);
  }

  function buttonClass(option: string) {
    const base =
      "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border";

    if (!result) {
      if (selectedAnswer === option && isPending)
        return `${base} border-forest-green/30 bg-forest-green/5 text-forest-green`;
      return `${base} border-ink/10 bg-white hover:border-forest-green/30 hover:bg-forest-green/5`;
    }

    if (option === result.correctAnswer)
      return `${base} border-forest-green bg-forest-green/10 text-forest-green`;
    if (option === selectedAnswer && !result.isCorrect)
      return `${base} border-danger bg-danger/10 text-danger`;
    return `${base} border-ink/5 bg-ink/[0.02] text-ink/30`;
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-ink/40 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{answeredCount + (result ? 1 : 0)} answered</span>
        </div>
        <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-forest-green rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + (result ? 1 : 0)) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Image question */}
      {isImage && question.media_url && (
        <div className="mb-4 rounded-xl overflow-hidden aspect-[4/3] bg-ink/5">
          <img
            src={question.media_url}
            alt="Bird to identify"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {isImage && !question.media_url && (
        <div className="mb-4 rounded-xl aspect-[4/3] bg-ink/5 flex items-center justify-center">
          <p className="text-sm text-ink/30">No photo available</p>
        </div>
      )}

      {/* Sound question */}
      {isSound && question.media_url && (
        <SoundPlayer src={question.media_url} revealed={!!result} answered={!!result} />
      )}

      {isSound && !question.media_url && (
        <div className="mb-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-ink/5 flex items-center justify-center">
            <p className="text-xs text-ink/30 text-center px-2">No audio</p>
          </div>
        </div>
      )}

      {/* Prompt */}
      <h2 className="text-lg font-semibold mb-4">{question.prompt}</h2>

      {/* Answer options */}
      <div className="flex flex-col gap-2 mb-6">
        {(question.answer_options as string[]).map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={!!result || isPending}
            className={buttonClass(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Result feedback */}
      {result && (
        <div
          className={`rounded-xl p-4 mb-4 text-sm ${
            result.isCorrect
              ? "bg-forest-green/10 text-forest-green"
              : "bg-danger/10 text-danger"
          }`}
        >
          {result.isCorrect
            ? "Correct!"
            : `Incorrect — the answer is ${result.correctAnswer}`}
        </div>
      )}

      {/* Next / Finish */}
      {result && (
        <div className="text-center">
          {isLastQuestion ? (
            <form action={completeQuizSession}>
              <input type="hidden" name="session_id" value={sessionId} />
              <button
                type="submit"
                className="bg-forest-green text-white font-medium py-3 px-8 rounded-xl hover:bg-forest-green/90 transition-colors"
              >
                See Results
              </button>
            </form>
          ) : (
            <button
              onClick={handleNext}
              className="bg-forest-green text-white font-medium py-3 px-8 rounded-xl hover:bg-forest-green/90 transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
