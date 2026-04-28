import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import PracticeSprint from './pages/PracticeSprint';
import Quiz from './pages/Quiz';
import ErrorArchive from './pages/ErrorArchive';
import ExamMode from './pages/ExamMode';
import Analytics from './pages/Analytics';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Full-screen exam — protected but no sidebar layout */}
        <Route
          path="/exam"
          element={
            <ProtectedRoute>
              <ExamMode />
            </ProtectedRoute>
          }
        />

        {/* Protected pages with sidebar layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/sprint" element={<PracticeSprint />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/errors" element={<ErrorArchive />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>

        {/* Admin (unprotected for now — keep as-is) */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
