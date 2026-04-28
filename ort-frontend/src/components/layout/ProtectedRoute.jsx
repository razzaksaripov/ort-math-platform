import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";

export default function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation(); // Запоминаем, куда пользователь хотел попасть

  if (!token) {
    // state={{ from: location }} позволит нам вернуть пользователя 
    // обратно на ту страницу, которую он запрашивал, после успешного входа
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}