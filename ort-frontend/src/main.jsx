import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import ExamMode from "./pages/ExamMode";
import AdminPage from "./pages/AdminPage";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Practice from "./pages/Practice"; 
import PracticeSprint from "./pages/PracticeSprint";
import ErrorArchive from "./pages/ErrorArchive";

function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
      <div className="text-5xl mb-4">🚧</div>
      <h2 className="text-2xl font-bold text-slate-700">{title}</h2>
      <p className="text-sm mt-2 font-medium bg-slate-100 px-4 py-1 rounded-full">
        Coming soon
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Публичный */}
        <Route path="/login" element={<Login />} />

        {/* С САЙДБАРОМ */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* 👇 ВОТ НАШИ ИСПРАВЛЕННЫЕ РОУТЫ ДЛЯ ПРАКТИКИ 👇 */}
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/topic/:id" element={<Quiz />} />
          
          <Route path="/analytics" element={<ComingSoon title="Analytics" />} />
          <Route path="/errors" element={<ErrorArchive />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/practice/sprint" element={<PracticeSprint />} />
          
        </Route>

        {/* БЕЗ САЙДБАРА — полноэкранный экзамен (Mock Exam) */}
        <Route
          path="/exam"
          element={
            <ProtectedRoute>
              <ExamMode />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);