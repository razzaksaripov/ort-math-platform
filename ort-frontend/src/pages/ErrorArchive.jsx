import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Archive, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Trophy, 
  RotateCcw, 
  ChevronLeft,
  Loader2
} from "lucide-react";
import MathText from "../components/math/MathText";
import api from "../services/api";

const ANSWER_LABELS = ["A", "B", "C", "D", "E"];

export default function ErrorArchive() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active"); // active | mastered | all
  const navigate = useNavigate();

  // Загрузка данных при смене фильтра
  useEffect(() => {
    loadErrors();
  }, [filter]);

  const loadErrors = async () => {
    setLoading(true);
    try {
      // Формируем запрос в зависимости от фильтра
      const params = filter === "all" ? "" : `?mastered=${filter === "mastered"}`;
      const res = await api.get(`/attempts/errors${params}`);
      setErrors(res.data);
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      setErrors([]);
    } finally {
      setLoading(false);
    }
  };

  // Функция отправки ответа (Retry)
  const handleRetry = async (errorId, selectedAnswer) => {
    try {
      const res = await api.patch(`/attempts/errors/${errorId}/retry`, {
        selected_answer: selectedAnswer,
      });
      return res.data;
    } catch (err) {
      console.error("Ошибка PATCH запроса:", err);
      return null;
    }
  };

  const removeErrorFromList = (errorId) => {
    setErrors((prev) => prev.filter((e) => e.id !== errorId));
  };

  const updateErrorInList = (errorId, updates) => {
    setErrors((prev) =>
      prev.map((e) => (e.id === errorId ? { ...e, ...updates } : e))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Archive className="w-5 h-5 text-indigo-600" />
                Архив ошибок
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mastery System 3/3</p>
            </div>
          </div>
          
          {/* Фильтры */}
          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl gap-1">
            {['active', 'mastered', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f === 'active' ? 'Активные' : f === 'mastered' ? 'Освоенные' : 'Все'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Синхронизация прогресса...</p>
          </div>
        ) : errors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <Trophy className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Список пуст!</h3>
            <p className="text-slate-500 mt-1">Здесь появятся задачи, в которых ты ошибся</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {errors.map((error) => (
                <ErrorCard
                  key={error.id}
                  error={error}
                  onRetry={handleRetry}
                  onMastered={() => removeErrorFromList(error.id)}
                  onUpdate={(updates) => updateErrorInList(error.id, updates)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// КОМПОНЕНТ КАРТОЧКИ ОШИБКИ
// ════════════════════════════════════════
function ErrorCard({ error, onRetry, onMastered, onUpdate }) {
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const question = error.question;
  if (!question) return null;

  const options = question.options || [];
  
  const handleSubmit = async () => {
    if (selected === null || submitting) return;
    setSubmitting(true);
    
    const label = ANSWER_LABELS[selected];
    const result = await onRetry(error.id, label);
    
    if (result) {
      setFeedback(result);
      // Обновляем состояние в родительском списке
      onUpdate({
        success_count: result.success_count,
        retry_count: result.retry_count,
        mastered: result.mastered,
      });

      // Если задача освоена, удаляем её через 2 секунды (после анимации успеха)
      if (result.mastered) {
        setTimeout(() => onMastered(), 2000);
      }
    }
    setSubmitting(false);
  };

  const successCount = feedback ? feedback.success_count : error.success_count;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: 100, filter: "blur(10px)" }}
      className={`bg-white rounded-[2.5rem] border-2 p-8 transition-all relative overflow-hidden ${
        feedback?.mastered ? "border-emerald-400 bg-emerald-50/30" : 
        feedback?.is_correct ? "border-emerald-200" :
        feedback ? "border-red-100" : "border-slate-200"
      }`}
    >
      {/* Прогресс 3/3 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-10 h-2 rounded-full transition-all duration-500 ${
                i < successCount ? "bg-emerald-500 shadow-sm" : "bg-slate-100"
              }`}
            />
          ))}
          <span className="text-[10px] font-black text-slate-400 ml-2 uppercase">
            Мастерство: {successCount}/3
          </span>
        </div>
        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
          ID: {error.id.slice(0,8)}
        </div>
      </div>

      {/* Текст вопроса */}
      <div className="text-slate-800 text-xl mb-8 leading-relaxed">
        <MathText>{question.content_latex}</MathText>
      </div>

      {/* Обратная связь (Верно/Неверно) */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-3xl mb-6 flex flex-col gap-2 ${
              feedback.is_correct ? "bg-emerald-100/50 border border-emerald-200" : "bg-red-50 border border-red-100"
            }`}
          >
            <div className="flex items-center gap-3">
              {feedback.is_correct ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <span className={`font-bold ${feedback.is_correct ? "text-emerald-700" : "text-red-700"}`}>
                {feedback.is_correct ? "Правильно!" : "Неверно — прогресс сброшен"}
              </span>
              <span className="ml-auto text-xs font-black text-amber-600">+{feedback.xp_earned} XP</span>
            </div>
            
            {!feedback.is_correct && (
              <div className="mt-2 text-sm text-slate-600 border-t border-red-100 pt-3">
                <p className="font-bold mb-1 text-slate-700 uppercase text-[10px]">Правильный ответ: {feedback.correct_answer}</p>
                <MathText>{feedback.explanation}</MathText>
                <button 
                  onClick={() => { setFeedback(null); setSelected(null); }}
                  className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase"
                >
                  <RotateCcw className="w-3 h-3" /> Попробовать снова
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Кнопки ответов (скрываются после ответа) */}
      {!feedback && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setSelected(idx)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  selected === idx 
                  ? "border-indigo-500 bg-indigo-50 shadow-md translate-x-1" 
                  : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                  selected === idx ? "bg-indigo-600 text-white" : "bg-white text-slate-400 border shadow-sm"
                }`}>
                  {ANSWER_LABELS[idx]}
                </div>
                <div className="text-slate-700 font-medium"><MathText>{opt}</MathText></div>
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={selected === null || submitting}
            className="w-full mt-4 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Проверить решение"}
          </button>
        </div>
      )}

      {/* Если задача освоена (3/3) */}
      {feedback?.mastered && (
        <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px] flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="bg-white p-6 rounded-full shadow-2xl border-4 border-emerald-500"
          >
            <Trophy className="w-12 h-12 text-emerald-500" />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}