import { motion } from "framer-motion";
import {
  Target, Timer, CheckCircle2, Flame,
  AlertTriangle, ChevronRight, BookOpen,
} from "lucide-react";
import useTopics from "../hooks/useTopics";
import useStats from "../hooks/useStats";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// Topic card color mapping
const topicColors = {
  Algebra: { bg: "bg-indigo-50", text: "text-indigo-700", bar: "bg-indigo-500", icon: "bg-indigo-100" },
  Geometry: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500", icon: "bg-emerald-100" },
  Comparisons: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500", icon: "bg-amber-100" },
  Logic: { bg: "bg-purple-50", text: "text-purple-700", bar: "bg-purple-500", icon: "bg-purple-100" },
  "Data Analysis": { bg: "bg-rose-50", text: "text-rose-700", bar: "bg-rose-500", icon: "bg-rose-100" },
};

const defaultColor = { bg: "bg-slate-50", text: "text-slate-700", bar: "bg-slate-500", icon: "bg-slate-100" };

export default function Dashboard() {
  const { topics, loading: topicsLoading } = useTopics();
  const { stats } = useStats();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const score = stats?.predicted_ort_score || 110;
  const scorePercent = Math.round(((score - 110) / 135) * 100);

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <h1 className="text-2xl font-bold text-text">
          Welcome back, {user?.username || "Student"} 👋
        </h1>
        <p className="text-text-2 text-sm mt-1">
          Keep pushing — your ORT score is improving!
        </p>
      </motion.div>

      {/* Stats Row — Bento Grid */}
      <motion.div
        variants={item}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          icon={<Target className="w-5 h-5 text-primary" />}
          label="Predicted Score"
          value={stats ? `${score}` : "—"}
          sub={`${scorePercent}% of 245`}
          accent="primary"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-success" />}
          label="Accuracy"
          value={stats ? `${stats.accuracy_rate}%` : "—"}
          sub={`${stats?.total_correct || 0} / ${stats?.total_solved || 0} correct`}
          accent="success"
        />
        <StatCard
          icon={<Timer className="w-5 h-5 text-warning" />}
          label="Avg Time"
          value={stats ? `${stats.average_time_seconds}s` : "—"}
          sub="per question"
          accent="warning"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-danger" />}
          label="Streak"
          value={stats ? `${stats.current_streak}` : "—"}
          sub={`${stats?.xp_points || 0} XP`}
          accent="danger"
        />
      </motion.div>

      {/* Predicted Score Progress Bar */}
      <motion.div
        variants={item}
        className="bg-surface rounded-2xl shadow-card border border-border p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-text">Predicted ORT Score</h3>
            <p className="text-sm text-text-2">
              Target: {user?.target_ort_score || 200} points
            </p>
          </div>
          <div className="text-3xl font-bold text-primary">{score}</div>
        </div>
        <div className="w-full h-3 bg-surface-3 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${scorePercent}%` }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light"
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-3">
          <span>110</span>
          <span>245</span>
        </div>
      </motion.div>

      {/* Topics */}
      <motion.div variants={item} className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Math Topics</h2>
          <button
            onClick={() => navigate("/practice")}
            className="text-sm text-primary font-medium hover:text-primary-dark transition-colors flex items-center gap-1"
          >
            Start Practice <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {topicsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-36 bg-surface-3 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </motion.div>
      )}

      {/* Error Archive Quick Stat */}
      {stats && stats.error_archive_count > 0 && (
        <motion.div
          variants={item}
          className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-card transition-shadow"
          onClick={() => navigate("/errors")}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-amber-800">
              {stats.error_archive_count} questions in Error Archive
            </div>
            <div className="text-sm text-amber-600">
              Review and retry to master them
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400" />
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <motion.div
      variants={item}
      className="bg-surface rounded-2xl shadow-card border border-border p-5 hover:shadow-soft transition-shadow"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl bg-${accent}-light/50 flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm text-text-2">{label}</span>
      </div>
      <div className="text-2xl font-bold text-text">{value}</div>
      <div className="text-xs text-text-3 mt-0.5">{sub}</div>
    </motion.div>
  );
}

/* ─── Topic Card ─── */
function TopicCard({ topic }) {
  const navigate = useNavigate();
  const c = topicColors[topic.name] || defaultColor;

  return (
    <motion.div
      variants={item}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/quiz?topic=${topic.id}`)}
      className={`${c.bg} rounded-2xl p-5 cursor-pointer border border-transparent hover:border-${c.bar}/30 transition-all`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl ${c.icon} flex items-center justify-center`}>
          <BookOpen className={`w-4 h-4 ${c.text}`} />
        </div>
        <div className="flex-1">
          <div className={`font-semibold ${c.text}`}>{topic.name}</div>
          <div className="text-xs text-text-3">{topic.category}</div>
        </div>
      </div>
      <div className="text-sm text-text-2 mb-3 line-clamp-2">
        {topic.description_ru || topic.description_ky || "ORT preparation topic"}
      </div>
      {/* Tap to practice */}
      <div className={`text-xs font-semibold ${c.text} flex items-center gap-1`}>
        Practice <ChevronRight className="w-3 h-3" />
      </div>
    </motion.div>
  );
}
