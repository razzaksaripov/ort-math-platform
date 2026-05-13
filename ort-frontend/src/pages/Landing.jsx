import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Target, Zap, BarChart2, Brain, ChevronRight, CheckCircle } from "lucide-react";

const features = [
  {
    icon: <Brain className="w-6 h-6 text-indigo-600" />,
    title: "ИИ-объяснения",
    desc: "Gemini анализирует твои ошибки и объясняет решение пошагово на русском языке",
  },
  {
    icon: <Target className="w-6 h-6 text-emerald-600" />,
    title: "Адаптивная практика",
    desc: "Задачи подбираются по твоему уровню — слабые темы прорабатываются глубже",
  },
  {
    icon: <Zap className="w-6 h-6 text-amber-600" />,
    title: "Спринт-режим",
    desc: "Тренируй скорость решения под давлением времени — как на настоящем ОРТ",
  },
  {
    icon: <BarChart2 className="w-6 h-6 text-rose-600" />,
    title: "Аналитика прогресса",
    desc: "Отслеживай свой предсказанный балл ОРТ и динамику по каждой теме",
  },
];

const topics = ["Арифметика", "Алгебра", "Геометрия", "Анализ данных", "Сравнения"];

const steps = [
  { num: "01", text: "Зарегистрируйся бесплатно" },
  { num: "02", text: "Пройди первый тест для определения уровня" },
  { num: "03", text: "Тренируйся по слабым темам с ИИ-поддержкой" },
  { num: "04", text: "Сдай ОРТ с уверенностью" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">

      {/* Навигация */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">ORT Math</span>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Войти →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-xs font-semibold tracking-widest text-indigo-600 uppercase mb-4 bg-indigo-50 px-3 py-1 rounded-full">
              Подготовка к ОРТ · Математика
            </span>
            <h1 className="text-5xl font-extrabold leading-tight text-slate-900 mb-6">
              Подготовься к ОРТ<br />
              <span className="text-indigo-600">умнее, не усерднее</span>
            </h1>
            <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
              Платформа с ИИ-репетитором, которая знает твои слабые места и помогает
              поднять балл по математике шаг за шагом.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
              >
                Начать бесплатно <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-4 rounded-2xl font-semibold text-sm text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                Войти в аккаунт
              </button>
            </div>
          </motion.div>

          {/* Preview card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-16 bg-slate-50 rounded-3xl border border-slate-200 p-6 text-left shadow-xl shadow-slate-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">ИИ</div>
              <span className="text-sm font-medium text-slate-700">ИИ-репетитор</span>
              <span className="ml-auto text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">● онлайн</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-sm text-slate-600 leading-relaxed">
              Ты решил задачу неправильно — забыл формулу площади трапеции. Давай разберём:
              <span className="block mt-2 font-mono text-indigo-700 text-xs bg-indigo-50 p-2 rounded-lg">
                S = ½ · (a + b) · h
              </span>
              Попробуй ещё раз с этой формулой. Я проверю 👇
            </div>
          </motion.div>
        </div>
      </section>

      {/* Темы */}
      <section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center text-xs text-slate-400 uppercase tracking-widest font-semibold mb-6">Темы ОРТ по математике</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {topics.map((t) => (
              <span key={t} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 shadow-sm">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Функции */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Всё что нужно для высокого балла</h2>
            <p className="text-slate-500">Не просто задачи — умная система которая учится вместе с тобой</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Как начать */}
      <section className="py-24 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Начать просто</h2>
          </div>
          <div className="space-y-4">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
              >
                <span className="text-2xl font-extrabold text-indigo-100 w-10 shrink-0">{s.num}</span>
                <span className="text-sm font-medium text-slate-700">{s.text}</span>
                <CheckCircle className="w-5 h-5 text-emerald-400 ml-auto shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Готов поднять свой балл?</h2>
          <p className="text-slate-500 mb-8">Регистрация бесплатна. Начни прямо сейчас.</p>
          <button
            onClick={() => navigate("/login")}
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
          >
            Начать бесплатно →
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">ORT Math</span>
          </div>
          <span className="text-xs text-slate-400">© 2026 · Все права защищены</span>
        </div>
      </footer>

    </div>
  );
}
