import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setAuthToken } from "../api/axios";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect, // <--- Added this
  signOut,
  onAuthStateChanged,
  getIdToken,
  signInWithCustomToken, // <--- Added this
  signInWithCredential,
  GoogleAuthProvider,
  User as FirebaseUser
} from "firebase/auth";
import { Capacitor } from "@capacitor/core"; // <--- Added this
import { auth, googleProvider, facebookProvider } from "../firebase/config";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
  bio?: string;
  gender?: string;
  phone?: string;
  createdAt?: string;
  patientProfile?: any;
  sharingCode?: string;
  firebaseUid: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  loginWithFacebook: () => Promise<any>;
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
        setLoading(false);
      }
    } catch (err: any) {
      console.error("❌ Error en getProfile:", err);
      if (err.response?.status === 401) {
        logout();
      }
      setTimeout(() => setLoading(false), 100);
    }
  }, []);

  // Sync Firebase user with Backend
  const syncWithBackend = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await getIdToken(firebaseUser);
      const res = await api.post("/auth/firebase-login", { idToken });

      if (res.data?.accessToken) {
        const { accessToken, user: loggedUser } = res.data;

        localStorage.setItem("token", accessToken);
        setAuthToken(accessToken);
        setTokenState(accessToken);
        setUser(loggedUser);
        return res.data;
      }
    } catch (err) {
      console.error("Error syncing with backend:", err);
      throw err;
    }
  };

  // Observe Firebase Auth state
  useEffect(() => {
    const initAuth = async () => {
      // 🚀 PRIMERO: Intentar recuperar sesión local (Backend Token)
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        console.log("🔄 Restaurando sesión desde LocalStorage...");
        setTokenState(savedToken);
        setAuthToken(savedToken);
        await getProfile(); // Verificar si el token sigue vivo
      } else {
        setLoading(false); // Si no hay token, dejamos de cargar (User = null)
      }
    };

    initAuth();

    // 📡 SEGUNDO: Escuchar a Firebase (como respaldo o para nuevos logins)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Solo sincronizamos si NO tenemos usuario ya cargado (para no pisar)
        // O si acabamos de hacer login nativo
        if (!localStorage.getItem("token")) {
          console.log("🔥 Firebase User detectado, sincronizando...");
          await syncWithBackend(firebaseUser);
        }
      }
    });

    return () => unsubscribe();
  }, [getProfile]);

  // LOGIN Firebase + Sync
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return await syncWithBackend(userCredential.user);
    } catch (err: any) {
      console.error("Login Error:", err);
      throw err;
    }
  };

  // REGISTER Firebase + Sync
  const register = async (data: any) => {
    try {
      const { email, password, name, role, gender, caregiverCode } = data;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update firebase profile if needed
      // Notify backend to create the user in our DB
      const idToken = await getIdToken(userCredential.user);
      const res = await api.post("/auth/firebase-register", {
        idToken,
        name,
        role,
        gender,
        caregiverCode
      });

      if (res.data?.accessToken) {
        const { accessToken, user: registeredUser } = res.data;
        localStorage.setItem("token", accessToken);
        setAuthToken(accessToken);
        setTokenState(accessToken);
        setUser(registeredUser);
        return res.data;
      }
      return res.data;
    } catch (err: any) {
      console.error("Register Error:", err);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // 🚀 LOGIN NATIVO (Estilo Echobeat)
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          const userCredential = await signInWithCredential(auth, credential);
          return await syncWithBackend(userCredential.user);
        }
        throw new Error("No se obtuvo el ID Token de Google.");
      } else {
        // En Web seguimos con el flujo normal de popup
        const result = await signInWithPopup(auth, googleProvider);
        return await syncWithBackend(result.user);
      }
    } catch (err) {
      console.error("Google Login Error:", err);
      throw err;
    }
  };

  const loginWithFacebook = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await signInWithRedirect(auth, facebookProvider);
        return;
      }
      const result = await signInWithPopup(auth, facebookProvider);
      return await syncWithBackend(result.user);
    } catch (err) {
      console.error("Facebook Login Error:", err);
      throw err;
    }
  };

  // LOGOUT Firebase + Local
  const logout = async () => {
    await signOut(auth);
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
        loginWithGoogle,
        loginWithFacebook,
        logout,
        getProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
