import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Flag,
  CheckCircle2,
  Maximize,
  Minimize,
  AlertTriangle,
  BookOpen,
  Scale,
  Calculator,
  LogOut,
} from "lucide-react";
import MathText from "../components/math/MathText";
import api from "../services/api";

const ANSWER_LABELS = ["A", "B", "C", "D", "E"];

const SECTIONS = {
  comparison: {
    label: "Часть 1: Сравнение величин",
    shortLabel: "Сравнения",
    timeMinutes: 30,
    questionCount: 30,
    icon: Scale,
    color: "amber",
    apiType: "comparison",
  },
  standard: {
    label: "Часть 2: Основная математика",
    shortLabel: "Основная математика",
    timeMinutes: 60,
    questionCount: 30,
    icon: Calculator,
    color: "indigo",
    apiType: "standard",
  },
};

const STATUS = {
  NOT_VISITED: "not_visited",
  CURRENT: "current",
  ANSWERED: "answered",
  SKIPPED: "skipped",
  FLAGGED: "flagged",
};

export default function ExamMode() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState("intro");
  const [currentSection, setCurrentSection] = useState("comparison");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [statuses, setStatuses] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const [sectionResults, setSectionResults] = useState({
    comparison: null,
    standard: null,
  });
  const [showConfirm, setShowConfirm] = useState(false);

  const section = SECTIONS[currentSection];
  const currentQuestion = questions[currentIdx];

  // ════════════════════════════════════════
  // FULLSCREEN
  // ════════════════════════════════════════
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch {
      setIsFullscreen(false);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch {}
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ════════════════════════════════════════
  // LOAD QUESTIONS
  // ════════════════════════════════════════
  const loadQuestions = useCallback(async (type) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/questions/exam?type=${type}&limit=${SECTIONS[type].questionCount}`
      );
      setQuestions(res.data);
      setCurrentIdx(0);
      setAnswers({});
      setSelected(null);
      const s = {};
      res.data.forEach((_, i) => {
        s[i] = i === 0 ? STATUS.CURRENT : STATUS.NOT_VISITED;
      });
      setStatuses(s);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ════════════════════════════════════════
  // START EXAM
  // ════════════════════════════════════════
  const startExam = useCallback(async () => {
    await enterFullscreen();
    setPhase("exam");
    setCurrentSection("comparison");
    setTimeLeft(SECTIONS.comparison.timeMinutes * 60);
    await loadQuestions("comparison");
  }, [enterFullscreen, loadQuestions]);

  // ════════════════════════════════════════
  // FINISH SECTION
  // ════════════════════════════════════════
  const handleFinishSection = useCallback(async () => {
    clearInterval(timerRef.current);
    if (selected !== null) {
      setAnswers((prev) => ({ ...prev, [currentIdx]: selected }));
      setStatuses((prev) => ({ ...prev, [currentIdx]: STATUS.ANSWERED }));
    }

    let correct = 0;
    let answered = 0;
    const finalAnswers = { ...answers };
    if (selected !== null) finalAnswers[currentIdx] = selected;

    questions.forEach((q, i) => {
      if (finalAnswers[i] !== undefined) {
        answered++;
        if (ANSWER_LABELS[finalAnswers[i]] === q.correct_answer) correct++;
      }
    });

    setSectionResults((prev) => ({
      ...prev,
      [currentSection]: {
        total: questions.length,
        answered,
        correct,
        skipped: questions.length - answered,
      },
    }));

    if (currentSection === "comparison") {
      setPhase("section_break");
    } else {
      setPhase("results");
      await exitFullscreen();
    }
  }, [answers, selected, currentIdx, questions, currentSection, exitFullscreen]);

  // ════════════════════════════════════════
  // TIMER
  // ════════════════════════════════════════
  useEffect(() => {
    if (phase !== "exam") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinishSection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, handleFinishSection]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ════════════════════════════════════════
  // NAVIGATION
  // ════════════════════════════════════════
  const goToQuestion = useCallback(
    (idx) => {
      if (selected !== null) {
        setAnswers((prev) => ({ ...prev, [currentIdx]: selected }));
        setStatuses((prev) => ({ ...prev, [currentIdx]: STATUS.ANSWERED }));
      } else if (statuses[currentIdx] === STATUS.CURRENT) {
        setStatuses((prev) => ({
          ...prev,
          [currentIdx]: STATUS.NOT_VISITED,
        }));
      }
      setCurrentIdx(idx);
      setSelected(answers[idx] ?? null);
      setStatuses((prev) => ({ ...prev, [idx]: STATUS.CURRENT }));
    },
    [currentIdx, selected, answers, statuses]
  );

  const handleNext = () =>
    currentIdx < questions.length - 1 && goToQuestion(currentIdx + 1);

  const handlePrev = () => currentIdx > 0 && goToQuestion(currentIdx - 1);

  const handleSkip = () => {
    setStatuses((prev) => ({ ...prev, [currentIdx]: STATUS.SKIPPED }));
    setSelected(null);
    currentIdx < questions.length - 1 && goToQuestion(currentIdx + 1);
  };

  const handleFlag = () => {
    setStatuses((prev) => ({
      ...prev,
      [currentIdx]:
        prev[currentIdx] === STATUS.FLAGGED ? STATUS.CURRENT : STATUS.FLAGGED,
    }));
  };

  const handleConfirmAnswer = () => {
    if (selected === null) return;
    setAnswers((prev) => ({ ...prev, [currentIdx]: selected }));
    setStatuses((prev) => ({ ...prev, [currentIdx]: STATUS.ANSWERED }));
    if (currentIdx < questions.length - 1) {
      setTimeout(() => goToQuestion(currentIdx + 1), 300);
    }
  };

  const startSection2 = async () => {
    setCurrentSection("standard");
    setTimeLeft(SECTIONS.standard.timeMinutes * 60);
    setPhase("exam");
    await loadQuestions("standard");
  };

  // ════════════════════════════════════════
  // RENDER: INTRO
  // ════════════════════════════════════════
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mx-auto flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Симуляция ОРТ
            </h1>
            <p className="text-slate-500">Математическая секция</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 space-y-4 shadow-sm">
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <Scale className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-800 text-sm">
                  Часть 1: Сравнение величин
                </div>
                <div className="text-xs text-amber-600 mt-0.5">
                  30 вопросов — 30 минут
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <Calculator className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <div className="font-semibold text-indigo-800 text-sm">
                  Часть 2: Основная математика
                </div>
                <div className="text-xs text-indigo-600 mt-0.5">
                  30 вопросов — 60 минут
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={startExam}
            className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Начать экзамен
          </button>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════════════
  // RENDER: SECTION BREAK
  // ════════════════════════════════════════
  if (phase === "section_break") {
    const r = sectionResults.comparison;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Часть 1 завершена!
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-slate-50 p-3 rounded-xl">
              <div className="font-bold">{r?.answered}</div>
              <div className="text-[10px] text-slate-500 uppercase">
                Отвечено
              </div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl">
              <div className="font-bold text-emerald-600">{r?.correct}</div>
              <div className="text-[10px] text-emerald-500 uppercase">
                Верно
              </div>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl">
              <div className="font-bold text-amber-600">{r?.skipped}</div>
              <div className="text-[10px] text-amber-500 uppercase">
                Пропущено
              </div>
            </div>
          </div>
          <button
            onClick={startSection2}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
          >
            Начать Часть 2
          </button>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════════════
  // RENDER: RESULTS
  // ════════════════════════════════════════
  if (phase === "results") {
    const r1 = sectionResults.comparison;
    const r2 = sectionResults.standard;
    const totalCorrect = (r1?.correct || 0) + (r2?.correct || 0);
    const totalAnswered = (r1?.answered || 0) + (r2?.answered || 0);
    const totalQuestions = (r1?.total || 0) + (r2?.total || 0);
    const accuracy =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;
    const predictedScore = Math.min(
      245,
      Math.round(110 + 135 * (totalCorrect / Math.max(totalQuestions, 1)))
    );

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              Результаты симуляции
            </h2>
          </div>

          {/* Score */}
          <div className="bg-indigo-600 rounded-2xl p-8 text-white text-center mb-6 shadow-xl shadow-indigo-100">
            <div className="text-sm opacity-80 uppercase tracking-wider mb-1">
              Прогноз балла ОРТ
            </div>
            <div className="text-6xl font-black">{predictedScore}</div>
            <div className="text-sm mt-1 opacity-80">из 245</div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-slate-800">
                {totalCorrect}/{totalQuestions}
              </div>
              <div className="text-[10px] text-slate-500 uppercase">
                Правильных
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-slate-800">{accuracy}%</div>
              <div className="text-[10px] text-slate-500 uppercase">
                Точность
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-slate-800">
                {totalQuestions - totalAnswered}
              </div>
              <div className="text-[10px] text-slate-500 uppercase">
                Пропущено
              </div>
            </div>
          </div>

          {/* Per section */}
          <div className="space-y-3 mb-6">
            {r1 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Сравнения
                  </span>
                </div>
                <span className="text-sm font-bold text-amber-700">
                  {r1.correct}/{r1.total}
                </span>
              </div>
            )}
            {r2 && (
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800">
                    Основная математика
                  </span>
                </div>
                <span className="text-sm font-bold text-indigo-700">
                  {r2.correct}/{r2.total}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition-all"
          >
            Вернуться в Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════════════
  // STATS (нужны для confirm dialog и правой панели)
  // ════════════════════════════════════════
  const answeredCount = Object.values(statuses).filter(
    (s) => s === STATUS.ANSWERED
  ).length;

  const skippedCount = Object.values(statuses).filter(
    (s) => s === STATUS.SKIPPED || s === STATUS.FLAGGED
  ).length;

  // ════════════════════════════════════════
  // RENDER: EXAM MODE
  // ════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* ════ MAIN CONTENT ════ */}
      <div className="flex-1 flex flex-col relative h-screen">
        {/* Top bar */}
        <div className="h-14 border-b flex items-center px-6 justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <section.icon
              className={`w-5 h-5 text-${section.color}-600`}
            />
            <span className="font-bold text-slate-700 text-sm">
              {section.shortLabel}
            </span>
            <span className="text-xs text-slate-400 bg-white border px-2 py-0.5 rounded-full font-medium">
              Вопрос {currentIdx + 1} / {questions.length}
            </span>
          </div>
          <button
            onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Question area */}
        <div className="flex-1 overflow-y-auto px-8 py-12">
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              currentQuestion && (
                <motion.div
                  key={currentIdx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Question text */}
                  <div className="mb-10">
                    <MathText className="text-xl leading-relaxed text-slate-800 font-medium">
                      {currentQuestion.content_latex}
                    </MathText>
                  </div>

                  {/* Answer options */}
                  <div className="grid gap-3">
                    {currentQuestion.options?.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelected(idx)}
                        className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                          selected === idx
                            ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-1 ring-indigo-600"
                            : "border-slate-100 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            selected === idx
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {ANSWER_LABELS[idx]}
                        </div>
                        <MathText className="flex-1 text-slate-700 font-medium text-base">
                          {opt}
                        </MathText>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )
            )}
          </div>
        </div>

        {/* Bottom nav bar */}
        <div className="h-20 border-t px-8 flex items-center justify-between bg-slate-50">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 text-slate-600 font-bold disabled:opacity-20"
          >
            <ChevronLeft className="w-5 h-5" /> Назад
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleFlag}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold transition-all ${
                statuses[currentIdx] === STATUS.FLAGGED
                  ? "bg-amber-50 border-amber-400 text-amber-700"
                  : "bg-white border-slate-200 text-slate-500"
              }`}
            >
              <Flag className="w-4 h-4" /> Отметить
            </button>
            <button
              onClick={handleSkip}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-500 font-bold bg-white"
            >
              Пропустить
            </button>
            {selected !== null ? (
              <button
                onClick={handleConfirmAnswer}
                className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Подтвердить
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentIdx === questions.length - 1}
                className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                Далее
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ════ RIGHT PANEL ════ */}
      <div className="w-80 border-l bg-slate-50 flex flex-col h-screen">
        {/* Timer */}
        <div className="p-6 border-b">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
            Оставшееся время
          </div>
          <div
            className={`text-4xl font-mono font-black ${
              timeLeft <= 60
                ? "text-red-500 animate-pulse"
                : timeLeft <= 300
                ? "text-amber-500"
                : "text-slate-800"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
            <motion.div
              animate={{
                width: `${(timeLeft / (section.timeMinutes * 60)) * 100}%`,
              }}
              className={`h-full ${
                timeLeft <= 60
                  ? "bg-red-500"
                  : timeLeft <= 300
                  ? "bg-amber-500"
                  : "bg-indigo-600"
              }`}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-3 border-b flex gap-6 text-xs">
          <div>
            <span className="text-slate-400">Сделано: </span>
            <span className="font-bold text-slate-700">
              {answeredCount}/{questions.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Пропущено: </span>
            <span className="font-bold text-amber-600">{skippedCount}</span>
          </div>
        </div>

        {/* Question grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">
            Навигация по вопросам
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, idx) => {
              const status =
                idx === currentIdx ? STATUS.CURRENT : statuses[idx];
              const colorMap = {
                [STATUS.NOT_VISITED]:
                  "bg-white border-slate-200 text-slate-300",
                [STATUS.CURRENT]:
                  "bg-indigo-600 border-indigo-600 text-white shadow-md scale-110 z-10",
                [STATUS.ANSWERED]:
                  "bg-emerald-500 border-emerald-500 text-white",
                [STATUS.FLAGGED]:
                  "bg-amber-400 border-amber-400 text-white",
                [STATUS.SKIPPED]:
                  "bg-slate-200 border-slate-200 text-slate-500",
              };
              return (
                <button
                  key={idx}
                  onClick={() => goToQuestion(idx)}
                  className={`aspect-square rounded-lg border-2 text-xs font-black flex items-center justify-center transition-all ${
                    colorMap[status]
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-2 text-[10px] text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-white border border-slate-200" />
              Не посещён
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-indigo-600" />
              Текущий
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              Отвечен
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-400" />
              Отмечен
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-slate-200" />
              Пропущен
            </div>
          </div>
        </div>

        {/* Finish button */}
        <div className="p-6 border-t bg-white">
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-4 bg-red-50 text-red-600 border-2 border-red-100 rounded-2xl text-sm font-black hover:bg-red-100 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <LogOut className="w-4 h-4" /> ЗАВЕРШИТЬ СЕКЦИЮ
          </button>
        </div>
      </div>

      {/* ════ CONFIRM DIALOG ════ */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
              <h3 className="text-xl font-black text-slate-800 text-center mb-3">
                Завершить Часть{" "}
                {currentSection === "comparison" ? "1" : "2"}?
              </h3>
              <p className="text-slate-500 text-center mb-8 font-medium">
                Вы ответили на{" "}
                <span className="text-slate-800 font-bold">
                  {answeredCount}
                </span>{" "}
                из{" "}
                <span className="text-slate-800 font-bold">
                  {questions.length}
                </span>{" "}
                вопросов.
                {questions.length - answeredCount > 0 && (
                  <span className="block text-amber-600 mt-1">
                    {questions.length - answeredCount} останутся без ответа.
                  </span>
                )}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-4 rounded-2xl border-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Назад
                </button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    handleFinishSection();
                  }}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700"
                >
                  Завершить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}