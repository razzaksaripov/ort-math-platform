import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, Timer, TrendingUp } from "lucide-react";
import api from "../services/api";

const TOPIC_COLORS = {
  "Арифметика":     { bar: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50" },
  "Алгебра":        { bar: "bg-indigo-500",  text: "text-indigo-700", bg: "bg-indigo-50" },
  "Геометрия":      { bar: "bg-violet-500",  text: "text-violet-700", bg: "bg-violet-50" },
  "Анализ данных":  { bar: "bg-emerald-500", text: "text-emerald-700",bg: "bg-emerald-50" },
};

const DEFAULT = { bar: "bg-slate-500", text: "text-slate-700", bg: "bg-slate-50" };

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/summary")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const topics = data?.topic_performance || [];
  const best = [...topics].sort((a, b) => b.accuracy - a.accuracy)[0];
  const worst = [...topics].sort((a, b) => a.accuracy - b.accuracy)[0];

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-8">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Analytics
        </h1>
        <p className="text-text-2 text-sm mt-1">Your performance breakdown by topic</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-3 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          {best && worst && (
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Strongest topic</span>
                </div>
                <div className="text-lg font-bold text-emerald-800">{best.name}</div>
                <div className="text-3xl font-black text-emerald-600 mt-1">{best.accuracy}%</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Needs work</span>
                </div>
                <div className="text-lg font-bold text-red-800">{worst.name}</div>
                <div className="text-3xl font-black text-red-500 mt-1">{worst.accuracy}%</div>
              </div>
            </motion.div>
          )}

          {/* Per-topic breakdown */}
          <motion.div variants={item} className="space-y-4">
            {topics.map((topic) => {
              const c = TOPIC_COLORS[topic.name] || DEFAULT;
              return (
                <div key={topic.id} className={`${c.bg} rounded-2xl p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-semibold ${c.text}`}>{topic.name}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-text-3 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {topic.total_attempts} attempts
                      </span>
                      <span className="text-text-3 flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" />
                        {topic.avg_time_sec}s avg
                      </span>
                      <span className={`font-bold ${c.text}`}>{topic.accuracy}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.accuracy}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${c.bar}`}
                    />
                  </div>
                </div>
              );
            })}

            {topics.length === 0 && (
              <div className="text-center py-20 text-text-3">
                No data yet — complete some practice sessions first.
              </div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
