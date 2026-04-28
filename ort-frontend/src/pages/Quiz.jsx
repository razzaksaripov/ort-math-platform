import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Home,
  Zap,
  Scale,
  Calculator,
} from "lucide-react";
import MathText, { MathBlock } from "../components/math/MathText";
import api from "../services/api";

const ANSWER_LABELS = ["A", "B", "C", "D", "E"];

export default function Quiz() {
  const [params] = useSearchParams();
  const topicId = params.get("topic") || 1;
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch questions ───
  useEffect(() => {
    api
      .get(`/questions/by-topic/${topicId}?limit=15`)
      .then((res) => setQuestions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [topicId]);

  // ─── Timer: +1 sec, stops on feedback ───
  useEffect(() => {
    if (feedback) return;
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [feedback, currentIdx]);

  const question = questions[currentIdx];
  const progress =
    questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  // Timer formatting
  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const timerColor =
    timeSpent > 120
      ? "text-red-500"
      : timeSpent > 90
      ? "text-amber-500"
      : "text-slate-500";

  // Question type info
  const isComparison = question?.question_type === "comparison";
  const options = question?.options || [];

  // ─── Submit answer ───
  const handleSubmit = useCallback(async () => {
    if (selected === null || !question || submitting) return;
    setSubmitting(true);

    const selectedLabel = ANSWER_LABELS[selected];

    try {
      const res = await api.post("/attempts/submit", {
        question_id: question.id,
        selected_answer: selectedLabel,
        time_spent_seconds: timeSpent,
      });
      setFeedback(res.data);
    } catch {
      // Fallback: local check if API fails
      const isCorrect = selectedLabel === question.correct_answer;
      setFeedback({
        is_correct: isCorrect,
        correct_answer: question.correct_answer || "A",
        explanation: question.explanation || "—",
        time_spent_seconds: timeSpent,
        is_time_sink: timeSpent > 90,
        xp_earned: isCorrect ? 10 : 0,
        added_to_error_archive: !isCorrect,
      });
    } finally {
      setSubmitting(false);
    }
  }, [selected, question, timeSpent, submitting]);

  // ─── Next question ───
  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setFeedback(null);
      setTimeSpent(0); // Reset timer
    } else {
      navigate("/dashboard");
    }
  };

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Empty state ───
  if (questions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 mb-4">
          Нет доступных вопросов для этой темы.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-indigo-600 font-medium"
        >
          Вернуться на Dashboard
        </button>
      </div>
    );
  }

  // ─── Find correct answer index for highlighting ───
  const correctIdx = ANSWER_LABELS.indexOf(feedback?.correct_answer);

  return (
    <div className="max-w-3xl mx-auto">
      {/* ════ Top bar: progress + timer ════ */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-slate-500 font-medium">
              Вопрос {currentIdx + 1} из {questions.length}
            </span>

            {/* Timer */}
            <div
              className={`flex items-center gap-1.5 font-mono text-sm font-semibold ${timerColor} transition-colors`}
            >
              <Timer className="w-4 h-4" />
              {formatTime(timeSpent)}
              {timeSpent > 120 && (
                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full ml-1">
                  Долго!
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            />
          </div>
        </div>
      </div>

      {/* ════ Question Card ════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-slate-200 p-8 mb-6"
        >
          {/* Badges row: question type + difficulty */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Question type badge */}
            {isComparison ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                <Scale className="w-3 h-3" />
                Сравнение величин
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                <Calculator className="w-3 h-3" />
                Основная математика
              </span>
            )}

            {/* Difficulty badge */}
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {"★".repeat(question.difficulty_level || 1)}
              {"☆".repeat(5 - (question.difficulty_level || 1))}
            </span>

            {/* Options count */}
            <span className="text-xs text-slate-400">
              {options.length} вариант{options.length === 4 ? "а" : "ов"}
            </span>
          </div>

          {/* Question text with LaTeX */}
          <div className="text-lg leading-relaxed text-slate-800">
            <MathText>{question.content_latex}</MathText>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ════ Answer Buttons — mapped from options ════ */}
      <div className="space-y-3 mb-6">
        {options.map((optionText, idx) => {
          const label = ANSWER_LABELS[idx];
          let variant = "default";

          if (feedback) {
            if (idx === correctIdx) {
              variant = "correct";
            } else if (idx === selected && !feedback.is_correct) {
              variant = "wrong";
            }
          } else if (idx === selected) {
            variant = "selected";
          }

          const styles = {
            default:
              "bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30",
            selected:
              "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200",
            correct:
              "bg-emerald-50 border-emerald-500",
            wrong:
              "bg-red-50 border-red-500",
          };

          const circleStyles = {
            default: "bg-slate-100 text-slate-500",
            selected: "bg-indigo-500 text-white",
            correct: "bg-emerald-500 text-white",
            wrong: "bg-red-500 text-white",
          };

          return (
            <motion.button
              key={idx}
              whileHover={!feedback ? { scale: 1.01 } : {}}
              whileTap={!feedback ? { scale: 0.99 } : {}}
              disabled={!!feedback}
              onClick={() => setSelected(idx)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${styles[variant]} disabled:cursor-default`}
            >
              {/* Letter circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 transition-all ${circleStyles[variant]}`}
              >
                {label}
              </div>

              {/* Option text with KaTeX */}
              <span className="flex-1 text-sm font-medium text-slate-700">
                <MathText>{optionText}</MathText>
              </span>

              {/* Feedback icons */}
              {feedback && idx === correctIdx && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              )}
              {feedback &&
                idx === selected &&
                !feedback.is_correct &&
                idx !== correctIdx && (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
            </motion.button>
          );
        })}
      </div>

      {/* ════ Feedback panel ════ */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-2xl p-5 mb-6 border ${
              feedback.is_correct
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {feedback.is_correct ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span
                className={`font-semibold ${
                  feedback.is_correct ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {feedback.is_correct ? "Правильно!" : "Неправильно"}
              </span>

              {/* XP earned */}
              {feedback.xp_earned > 0 && (
                <span className="ml-auto flex items-center gap-1 text-sm text-amber-600 font-medium">
                  <Zap className="w-4 h-4" />+{feedback.xp_earned} XP
                </span>
              )}
            </div>

            {/* Time spent */}
            <div className="text-xs text-slate-400 mb-2">
              Время: {formatTime(feedback.time_spent_seconds || timeSpent)}
              {feedback.is_time_sink && (
                <span className="ml-2 text-red-500 font-medium">
                  ⚠ Слишком долго (&gt;90с)
                </span>
              )}
            </div>

            {/* Explanation with LaTeX */}
            <div className="text-sm text-slate-600 leading-relaxed">
              <MathText>{feedback.explanation}</MathText>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ Action Buttons ════ */}
      <div className="flex gap-3">
        {!feedback ? (
          <button
            onClick={handleSubmit}
            disabled={selected === null || submitting}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Проверяем..." : "Проверить ответ"}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            {currentIdx < questions.length - 1 ? (
              <>
                Следующий вопрос <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Завершить <Home className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}