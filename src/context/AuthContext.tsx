import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setAuthToken } from "../api/axios";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect, // <--- Added this
  signOut,
  onAuthStateChanged,
  getIdToken,
  signInWithCustomToken, // <--- Added this
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
        const { accessToken, firebaseToken, user: loggedUser } = res.data;

        // 🚀 LOGIN NATIVO EN FIREBASE USANDO EL TOKEN DEL BACKEND
        if (firebaseToken) {
          await signInWithCustomToken(auth, firebaseToken);
        }

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // We have a firebase user, ensure we are synced with backend
        const savedToken = localStorage.getItem("token");
        if (!savedToken) {
          await syncWithBackend(firebaseUser);
        } else {
          setTokenState(savedToken);
          setAuthToken(savedToken);
          getProfile();
        }
      } else {
        // No firebase user
        setLoading(false);
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
      console.log("🚀 Iniciando Login con Google (Firebase Puro)...");

      // En móviles, signInWithPopup a veces falla si no hay un plugin nativo,
      // pero es la única forma de no usar el backend como proxy.
      const result = await signInWithPopup(auth, googleProvider);
      console.log("✅ Firebase Auth exitoso:", result.user.email);

      // Sincronizamos con el backend para que sepa que existimos
      return await syncWithBackend(result.user);
    } catch (err: any) {
      console.error("❌ Error en Firebase Google Login:", err);

      // Si falla por entorno (común en APKs sin plugin nativo)
      if (err.code === 'auth/operation-not-supported-in-this-environment' || err.code === 'auth/popup-blocked') {
        alert("Tu celular no permite ventanas emergentes para el login. Intentando modo alternativo...");
        await signInWithRedirect(auth, googleProvider);
        return;
      }
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
