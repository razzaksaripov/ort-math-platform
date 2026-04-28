import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Zap, 
  BrainCircuit, 
  ChevronRight, 
  Scale, 
  Calculator, 
  Clock,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";


const TOPICS = [
  { id: 5, name: "Арифметика", icon: "🔢", color: "blue" },
  { id: 6, name: "Алгебра", icon: "📉", color: "indigo" },
  { id: 7, name: "Геометрия", icon: "📐", color: "violet" },
  { id: 8, name: "Анализ данных", icon: "📊", color: "emerald" },
];

export default function Practice() {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/analytics/summary");
        if (res.data.topic_performance && res.data.topic_performance.length > 0) {
          const weakTopic = [...res.data.topic_performance].sort((a, b) => a.accuracy - b.accuracy)[0];
          setRecommendation(weakTopic);
        }
      } catch (err) {
        console.error("Ошибка загрузки статистики", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Приветствие */}
      <header className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Твоя тренировка</h1>
        <p className="text-slate-500">Система адаптирует задачи под твой уровень</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ════ ЛЕВАЯ КОЛОНКА: Спринты и Темы ════ */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 fill-amber-400 text-amber-400" /> Ежедневные спринты
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Карточка: Сравнение величин */}
            <motion.button
              whileHover={{ y: -5 }}
              onClick={() => navigate("/practice/sprint?type=comparison&limit=20")}
              className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[2rem] text-white text-left shadow-xl shadow-amber-100 relative overflow-hidden group"
            >
              <Scale className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 group-hover:scale-110 transition-transform" />
              <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-1">Сравнение величин</h3>
              <p className="text-sm opacity-80 mb-4">20 задач за 20 минут</p>
              <div className="inline-flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-xl font-bold text-xs shadow-sm">
                Начать спринт <ChevronRight className="w-3 h-3" />
              </div>
            </motion.button>

            {/* Карточка: Основная математика */}
            <motion.button
              whileHover={{ y: -5 }}
              onClick={() => navigate("/practice/sprint?type=standard&limit=20")}
              className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[2rem] text-white text-left shadow-xl shadow-indigo-100 relative overflow-hidden group"
            >
              <Calculator className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 group-hover:scale-110 transition-transform" />
              <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-1">Основная математика</h3>
              <p className="text-sm opacity-80 mb-4">20 задач за 30 минут</p>
              <div className="inline-flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs shadow-sm">
                Начать спринт <ChevronRight className="w-3 h-3" />
              </div>
            </motion.button>
          </div>

          {/* Точечная работа по темам */}
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest pt-4">Точечная работа над пробелами</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => navigate(`/quiz?topic=${topic.id}`)}
                className="bg-white border border-slate-100 p-4 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all text-center group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{topic.icon}</div>
                <div className="text-xs font-bold text-slate-700 leading-tight">{topic.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ════ ПРАВАЯ КОЛОНКА: ИИ-Советник ════ */}
        <div className="space-y-6">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-indigo-500" /> ИИ-Наставник
          </h2>

          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-indigo-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 leading-tight">Персональный совет</h4>
                <p className="text-xs text-slate-400">На основе твоих ответов</p>
              </div>
            </div>

            {recommendation ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-indigo-500">
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    «Твоя точность в теме <span className="font-bold text-indigo-600">{recommendation.name}</span> составляет <span className="font-bold">{recommendation.accuracy}%</span>. Рекомендую сфокусироваться на ней, чтобы поднять общий балл ОРТ.»
                  </p>
                </div>
                <button 
                  onClick={() => navigate(`/quiz?topic=${recommendation.id}`)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors"
                >
                  Тренировать эту тему
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Анализирую данные...</p>
              </div>
            )}
          </div>

          {/* Быстрые ссылки - Архив ошибок */}
          <div 
            className="bg-amber-50 rounded-2xl p-4 flex items-center gap-3 border border-amber-100 group cursor-pointer hover:bg-amber-100 transition-colors" 
            onClick={() => navigate("/errors")}
          >
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <div className="text-xs font-black text-amber-800 uppercase">Архив ошибок</div>
              <div className="text-[10px] text-amber-600 font-medium">Повтори то, что забыл</div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>
    </div>
  );
}