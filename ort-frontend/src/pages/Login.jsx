import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Mail, Lock, User } from "lucide-react";
import api from "../services/api";
import useAuthStore from "../store/authStore";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. РЕГИСТРАЦИЯ (отправляем JSON)
      if (isRegister) {
        await api.post("/auth/register", { email, username, password });
        // После регистрации сразу пробуем войти
      }

      // 2. ЛОГИН (отправляем FormData для FastAPI OAuth2)
      const loginData = new FormData();
      loginData.append("username", email); // FastAPI ждет email в поле username
      loginData.append("password", password);

      const res = await api.post("/auth/login", loginData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Сохраняем токены в Zustand
      setTokens(res.data.access_token, res.data.refresh_token);

      // 3. ПОЛУЧЕНИЕ ПРОФИЛЯ (используем свежий токен)
      const me = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });
      setUser(me.data);

      // Переход в личный кабинет
      navigate("/dashboard");
    } catch (err) {
      console.error("Auth error:", err);
      setError(
        err.response?.data?.detail || 
        "Ошибка доступа. Проверьте почту и пароль."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ORT Math</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isRegister ? "Регистрация аккаунта" : "С возвращением!"}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Имя пользователя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                required
                minLength={6}
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Загрузка..." : isRegister ? "Создать аккаунт" : "Войти"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
            >
              {isRegister
                ? "Уже есть аккаунт? Войти"
                : "Нет аккаунта? Зарегистрироваться"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}