import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Zap,
  Target
} from "lucide-react";
import MathText from "../components/math/MathText";
import api from "../services/api";

const ANSWER_LABELS = ["A", "B", "C", "D", "E"];

// Справочник тем (чтобы красиво писать название темы, в которой ошибся студент)
const TOPIC_NAMES = {
  5: "Арифметика",
  6: "Алгебра",
  7: "Геометрия",
  8: "Анализ данных"
};

export default function PracticeSprint() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const type = searchParams.get("type") || "comparison";
  const limit = parseInt(searchParams.get("limit") || "20");
  const timeMinutes = type === "comparison" ? 20 : 30;

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Состояние текущего вопроса
  const [selected, setSelected] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  
  // Таймеры, статистика и ИСТОРИЯ
  const [timeLeft, setTimeLeft] = useState(timeMinutes * 60);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // Массив для хранения истории ответов
  const [history, setHistory] = useState([]);
  
  const timerRef = useRef(null);

  // ─── ЗАГРУЗКА ВОПРОСОВ ───
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get(`/questions/exam?type=${type}&limit=${limit}`);
        setQuestions(res.data);
      } catch (err) {
        console.error("Ошибка загрузки", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [type, limit]);

  // ─── ГЛОБАЛЬНЫЙ ТАЙМЕР СПРИНТА ───
  useEffect(() => {
    if (loading || isFinished) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, isFinished]);

  // ─── СОХРАНЕНИЕ РЕЗУЛЬТАТОВ ВСЕГО СПРИНТА ДЛЯ АНАЛИТИКИ ───
  useEffect(() => {
    if (isFinished && questions.length > 0) {
      const saveSprintSession = async () => {
        try {
          const totalTimeSpent = (timeMinutes * 60) - timeLeft;
          await api.post("/analytics/sprint-session", {
            sprint_type: type,
            total_questions: questions.length,
            correct_answers: score,
            time_spent_seconds: totalTimeSpent
          });
        } catch (err) {
          console.error("Ошибка при сохранении сессии спринта", err);
        }
      };
      saveSprintSession();
    }
  }, [isFinished, questions.length, score, timeLeft, timeMinutes, type]);

  const currentQuestion = questions[currentIdx];

  // ─── ПРОВЕРКА ОТВЕТА И СОХРАНЕНИЕ В ИСТОРИЮ ───
  const handleCheck = async () => {
    if (selected === null || isChecked) return;
    
    setIsChecked(true);
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    const isCorrect = ANSWER_LABELS[selected] === currentQuestion.correct_answer;
    
    if (isCorrect) setScore((prev) => prev + 1);

    // Сохраняем результат этого вопроса в историю
    setHistory((prev) => [
      ...prev,
      {
        question: currentQuestion,
        userAnswer: ANSWER_LABELS[selected],
        isCorrect: isCorrect,
        timeSpent: timeSpent
      }
    ]);

    // Отправляем статистику отдельного вопроса на бэкенд
    try {
      await api.post("/attempts/submit", {
        question_id: currentQuestion.id,
        selected_answer: ANSWER_LABELS[selected],
        time_spent_seconds: timeSpent,
      });
    } catch (err) {
      console.error("Ошибка сохранения попытки", err);
    }
  };

  // ─── СЛЕДУЮЩИЙ ВОПРОС ───
  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelected(null);
      setIsChecked(false);
      setQuestionStartTime(Date.now());
    } else {
      setIsFinished(true);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── ЭКРАН РЕЗУЛЬТАТОВ И АНАЛИЗ ОШИБОК ───
  if (isFinished) {
    const totalQ = questions.length || 1;
    const percent = Math.round((score / totalQ) * 100);
    
    // Фильтруем только ошибки из истории
    const mistakes = history.filter((h) => !h.isCorrect);

    return (
      <div className="p-8 max-w-4xl mx-auto mt-6">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100 mb-8 text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Спринт завершен!</h2>
          <p className="text-slate-500 mb-8">Смотри результаты и обязательно разбери ошибки ниже.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-lg mx-auto">
            <div className="bg-slate-50 p-6 rounded-2xl">
              <div className="text-4xl font-black text-indigo-600 mb-1">{score}/{questions.length}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Верных ответов</div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl">
              <div className="text-4xl font-black text-slate-700 mb-1">{percent}%</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Точность</div>
            </div>
          </div>
        </div>

        {/* БЛОК РАЗБОРА ОШИБОК */}
        {mistakes.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-red-500" />
              Твои ошибки ({mistakes.length})
            </h3>
            <div className="space-y-4">
              {mistakes.map((mistake, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm flex flex-col md:flex-row gap-6">
                  {/* Информация о вопросе */}
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Тема: {TOPIC_NAMES[mistake.question.topic_id] || "Общая математика"}
                    </div>
                    <div className="text-slate-700 mb-4 bg-slate-50 p-4 rounded-xl line-clamp-3">
                       <MathText>{mistake.question.content_latex}</MathText>
                    </div>
                  </div>
                  
                  {/* Ответы */}
                  <div className="w-full md:w-48 space-y-3 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Твой ответ</div>
                      <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 px-3 py-2 rounded-lg">
                        <XCircle className="w-4 h-4" /> {mistake.userAnswer}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Правильный</div>
                      <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-3 py-2 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" /> {mistake.question.correct_answer}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mistakes.length === 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center text-emerald-800 font-bold mb-8">
             Идеальная работа! Ни одной ошибки. 🎉
          </div>
        )}

        <button 
          onClick={() => navigate("/practice")}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
        >
          Вернуться к тренировкам
        </button>
      </div>
    );
  }

  // ─── ОСНОВНОЙ ИНТЕРФЕЙС СПРИНТА ───
  return (
    <div className="max-w-3xl mx-auto p-6 mt-4">
      {/* Верхняя панель: Прогресс и Таймер */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-sm font-bold">
            Вопрос {currentIdx + 1} / {questions.length}
          </div>
          <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300" 
              style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        
        <div className={`flex items-center gap-2 font-mono font-bold text-lg ${timeLeft < 300 ? "text-red-500 animate-pulse" : "text-slate-700"}`}>
          <Timer className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Текст вопроса */}
      <div className="bg-white rounded-3xl p-8 mb-6 shadow-sm border border-slate-100">
        <MathText className="text-xl leading-relaxed text-slate-800 font-medium">
          {currentQuestion?.content_latex}
        </MathText>
      </div>

      {/* Варианты ответов */}
      <div className="space-y-3 mb-6">
        {currentQuestion?.options?.map((opt, idx) => {
          const isCorrectAnswer = ANSWER_LABELS[idx] === currentQuestion.correct_answer;
          
          let btnClass = "border-slate-200 bg-white hover:border-slate-300 text-slate-700";
          let badgeClass = "bg-slate-100 text-slate-500";

          if (isChecked) {
            if (isCorrectAnswer) {
              btnClass = "border-emerald-500 bg-emerald-50 text-emerald-900";
              badgeClass = "bg-emerald-500 text-white";
            } else if (selected === idx && !isCorrectAnswer) {
              btnClass = "border-red-400 bg-red-50 text-red-900";
              badgeClass = "bg-red-500 text-white";
            } else {
              btnClass = "border-slate-100 bg-slate-50 opacity-50";
            }
          } else if (selected === idx) {
            btnClass = "border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-100";
            badgeClass = "bg-indigo-600 text-white";
          }

          return (
            <button
              key={idx}
              disabled={isChecked}
              onClick={() => setSelected(idx)}
              className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${btnClass}`}
            >
              <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center font-bold text-sm transition-colors ${badgeClass}`}>
                {ANSWER_LABELS[idx]}
              </div>
              <MathText className="flex-1 font-medium text-base">{opt}</MathText>
              
              {isChecked && isCorrectAnswer && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
              {isChecked && selected === idx && !isCorrectAnswer && <XCircle className="w-6 h-6 text-red-500" />}
            </button>
          );
        })}
      </div>

      {/* Объяснение */}
      <AnimatePresence>
        {isChecked && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
              <h4 className="flex items-center gap-2 font-bold text-amber-800 mb-3">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Разбор решения
              </h4>
              <div className="text-amber-900/80 text-sm leading-relaxed">
                {currentQuestion?.explanation ? (
                  <MathText>{currentQuestion.explanation}</MathText>
                ) : (
                  <p className="italic opacity-70">Детальное объяснение для этого вопроса еще формируется ИИ.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Кнопки Проверить / Далее */}
      <div className="flex justify-end">
        {!isChecked ? (
          <button
            onClick={handleCheck}
            disabled={selected === null}
            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200"
          >
            Проверить ответ
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all"
          >
            Следующий вопрос <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}