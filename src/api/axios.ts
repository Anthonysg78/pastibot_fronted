import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: false,
});


// 🛡️ INTERCEPTOR PARA MANEJO DE SESIÓN EXPIRADA (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("🔐 Sesión expirada o no autorizada. Redirigiendo a login...");
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/welcome")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;

  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export default api;
