import axios from "axios";
import useAuthStore from "../store/authStore";

// Создаем экземпляр axios с базовым URL твоего FastAPI
const api = axios.create({
  baseURL: "https://ort-math-platform.onrender.com/api/v1",
  headers: { "Content-Type": "application/json" },
});

/**
 * Интерцептор запроса: автоматически добавляет Access Token в заголовок Authorization
 */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Интерцептор ответа: обрабатывает ошибки, включая автоматический Refresh Token при 401
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если получили 401 (Unauthorized) и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          // Пытаемся получить новый Access Token
          const res = await axios.post(
            "https://ort-math-platform.onrender.com/api/v1/auth/refresh",
            { refresh_token: refreshToken }
          );

          const { access_token, refresh_token: new_refresh_token } = res.data;
          
          // Обновляем токены в хранилище Zustand
          useAuthStore.getState().setTokens(access_token, new_refresh_token);

          // Повторяем изначальный запрос с новым токеном
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Если refresh токен тоже протух — выходим из системы
          useAuthStore.getState().logout();
          window.location.href = "/login";
        }
      } else {
        // Если рефреш токена нет — выходим
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Экспортируем готовый экземпляр для использования в ExamMode и других компонентах
export default api;