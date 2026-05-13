import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  Timer,
  BarChart3,
  Archive,
  LogOut,
} from "lucide-react";
import useAuthStore from "../../store/authStore";

const mainLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/practice", icon: Target, label: "Practice" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/errors", icon: Archive, label: "Error Archive" },
];

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const mobileLinks = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Главная" },
    { to: "/practice", icon: Target, label: "Практика" },
    { to: "/exam", icon: Timer, label: "Экзамен", isButton: true },
    { to: "/analytics", icon: BarChart3, label: "Аналитика" },
    { to: "/errors", icon: Archive, label: "Ошибки" },
  ];

  return (
    <>
    {/* Нижнее меню — только на мобиле */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-2">
      {mobileLinks.map(({ to, icon: Icon, label, isButton }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-medium transition-all ${
              isActive ? "text-indigo-600" : "text-slate-400"
            } ${isButton ? "bg-indigo-600 text-white px-3 py-2 rounded-xl" : ""}`
          }
        >
          <Icon className={`w-5 h-5 ${isButton ? "text-white" : ""}`} />
          <span className={isButton ? "text-white" : ""}>{label}</span>
        </NavLink>
      ))}
    </nav>

    {/* Боковое меню — только на десктопе */}
    <aside className="glass shadow-soft w-60 h-screen fixed left-0 top-0 z-40 flex-col hidden md:flex">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-text">
          ORT Math
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3">
        <div className="text-[10px] text-text-3 font-semibold uppercase tracking-wider px-3 mb-2">
          Menu
        </div>
        <div className="space-y-1">
          {mainLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-2 hover:bg-surface-3 hover:text-text"
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Mock Exam — отдельный выделенный блок */}
        <div className="mt-6">
          <div className="text-[10px] text-text-3 font-semibold uppercase tracking-wider px-3 mb-2">
            Exam
          </div>
          <button
            onClick={() => navigate("/exam")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-primary/5 to-primary/10 text-primary hover:from-primary/10 hover:to-primary/20 border border-primary/20"
          >
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Timer className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="leading-tight">Mock Exam</div>
              <div className="text-[10px] text-text-3 font-normal">
                Симуляция ОРТ — 90 мин
              </div>
            </div>
          </button>
        </div>
      </nav>

      {/* User */}
      <div className="px-4 pb-5 border-t border-border pt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-xs font-semibold">
            {user?.username?.slice(0, 2).toUpperCase() || "U"}
          </div>
          <div className="text-sm">
            <div className="font-medium text-text truncate max-w-[140px]">
              {user?.username || "Student"}
            </div>
            <div className="text-text-3 text-xs">{user?.email || ""}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-2 hover:bg-danger-light hover:text-danger transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
    </>
  );
}