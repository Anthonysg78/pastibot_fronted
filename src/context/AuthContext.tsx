import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setAuthToken } from "../api/axios";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
  bio?: string;
  gender?: string;
  createdAt?: string;
  patientProfile?: any;
  sharingCode?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  getProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Obtener perfil real - Usamos useCallback para que no cambie la referencia
  const getProfile = useCallback(async () => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/auth/profile");
      if (res.data) {
        setUser(res.data);
      }
    } catch (err: any) {
      console.error("❌ Error en getProfile:", err);
      // Solo limpiamos si es un error de autenticación real
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar token guardado al abrir app
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setTokenState(savedToken);
      setAuthToken(savedToken);
      getProfile();
    } else {
      setLoading(false);
    }
  }, [getProfile]);

  // LOGIN normal
  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.accessToken) {
      const { accessToken, user: loggedUser } = res.data;
      localStorage.setItem("token", accessToken);
      setAuthToken(accessToken);
      setTokenState(accessToken);
      setUser(loggedUser);
      return res.data;
    }
    return null;
  };

  // REGISTER normal
  const register = async (data: any) => {
    const res = await api.post("/auth/register", data);
    if (res.data?.accessToken) {
      const { accessToken, user: registeredUser } = res.data;
      localStorage.setItem("token", accessToken);
      setAuthToken(accessToken);
      setTokenState(accessToken);
      setUser(registeredUser);
      return res.data;
    }
    return res.data;
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    setTokenState(null);
    setUser(null);
    setAuthToken(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        getProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
