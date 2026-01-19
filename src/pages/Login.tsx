import React, { useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { IonPage, IonContent, IonInput, IonButton } from "@ionic/react";
import { FaFacebook } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";

import { useAuth } from "../context/AuthContext";
import { api } from "../api/axios";
import "./Login.css";

const Login: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { login } = useAuth();

  // 📋 Source of Truth: The URL (Aggressive detection for mobile/Ionic transitions)
  const getRoleFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("role");
    return (r === 'PACIENTE' || r === 'CUIDADOR') ? r : 'CUIDADOR';
  };

  const activeRole = getRoleFromUrl();

  const [email, setEmail] = useState("");
  const [password, setPasswordValue] = useState("");
  const { user } = useAuth();

  // 🛡️ EFECTO DE PROTECCIÓN: Si ya está logueado con el rol correcto, saltar login
  React.useEffect(() => {
    if (user && user.role === activeRole) {
      history.replace(activeRole === "CUIDADOR" ? "/care/home" : "/patient/home");
    }
  }, [user, activeRole, history]);

  const handleLogin = async () => {
    try {
      const response: any = await login(email, password);
      const user = response?.user ?? null;

      if (!user) {
        alert("Error inesperado: El backend no devolvió información del usuario.");
        return;
      }

      if (!user.password) {
        alert("Esta cuenta fue creada con Google. Debes crear una contraseña.");
        history.push("/password");
        return;
      }

      // 🟩 Usuario sin rol (primera vez)
      if (!user.role) {
        const backendRole = activeRole;
        try {
          const res = await api.post("/auth/set-role", { role: backendRole });
          if (res.data?.accessToken) {
            localStorage.setItem("token", res.data.accessToken);
            window.location.href = backendRole === 'CUIDADOR' ? "/care/home" : "/patient/home";
            return;
          }
        } catch (err) {
          console.error("Error auto-asignando rol:", err);
        }
        history.push("/selectrole");
        return;
      }

      if (user.role === "CUIDADOR") {
        history.push("/care/home");
        return;
      }

      if (user.role === "PACIENTE") {
        history.push("/patient/home");
        return;
      }

    } catch (error: any) {
      const msg = error?.response?.data?.message ?? "";
      if (msg.includes("Debes crear una contraseña")) {
        alert("Tu cuenta fue creada con Google/Facebook. Debes crear una contraseña.");
        history.push("/password");
        return;
      }
      alert("Correo o contraseña incorrectos.");
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className={`login-page ${activeRole === 'PACIENTE' ? 'patient-theme' : ''}`}>

        {/* Formas decorativas */}
        <div className="top-shape"></div>
        <div className="bottom-shape"></div>

        <div className="login-container">

          <h1 className="title" style={{ fontSize: '3rem', marginBottom: '4px' }}>pastibot</h1>
          <p className="subtitle" style={{ marginBottom: '35px' }}>
            Inicia sesión como <strong style={{ color: activeRole === 'PACIENTE' ? '#e65100' : 'var(--primary)' }}>
              {activeRole === 'CUIDADOR' ? 'Cuidador' : 'Paciente'}
            </strong>
          </p>

          {/* INPUT EMAIL */}
          <IonInput
            className="input"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onIonChange={(e) => setEmail(e.detail.value || "")}
          />

          {/* INPUT PASSWORD */}
          <IonInput
            className="input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onIonChange={(e) => setPasswordValue(e.detail.value || "")}
          />

          {/* LINK OLVIDAR CONTRASEÑA */}
          <div style={{ textAlign: 'right', width: '100%', marginBottom: '25px' }}>
            <a href="/forgot" className="forgot" style={{ margin: 0, fontWeight: 700 }}>¿Olvidaste tu contraseña?</a>
          </div>

          {/* BOTÓN INICIAR SESIÓN */}
          <IonButton expand="block" className="signin-btn" onClick={handleLogin}>
            Iniciar Sesión
          </IonButton>

          {/* CREAR CUENTA & CAMBIAR ROL */}
          <div style={{ marginTop: '20px' }}>
            <p className="create" style={{ marginBottom: '10px' }}>
              ¿No tienes una cuenta? <a onClick={() => history.push("/register?role=" + activeRole)}>Regístrate aquí</a>
            </p>
            <a
              onClick={() => history.push("/welcome")}
              style={{ fontSize: '0.85rem', color: '#90a4ae', textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              ← ¿No eres {activeRole === 'CUIDADOR' ? 'cuidador' : 'paciente'}? Cambiar rol
            </a>
          </div>

          {/* DIVIDER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0', opacity: 0.3 }}>
            <div style={{ flex: 1, height: '1px', background: '#000' }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>O ENTRAR CON</span>
            <div style={{ flex: 1, height: '1px', background: '#000' }}></div>
          </div>

          {/* ICONOS REDES SOCIALES */}
          <div className="socials">
            <FcGoogle
              className="social-icon google"
              onClick={() => {
                const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
                window.location.href = `${baseUrl}/auth/google?role=${activeRole}`;
              }}
              style={{ width: '55px', height: '55px' }}
            />
            <FaFacebook
              className="social-icon facebook"
              onClick={() => {
                const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
                window.location.href = `${baseUrl}/auth/facebook?role=${activeRole}`;
              }}
              style={{ width: '55px', height: '55px', color: '#1877F2' }}
            />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
