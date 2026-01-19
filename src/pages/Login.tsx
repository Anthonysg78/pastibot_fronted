import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { IonPage, IonContent, IonInput, IonButton } from "@ionic/react";
import { FaFacebook } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";

import { useAuth } from "../context/AuthContext";
import { api } from "../api/axios";
import StatusModal from "../components/StatusModal";
import "./Login.css";

const Login: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { login: authLogin, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Status Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ type: 'success' | 'error' | 'warning', title: string, message: string }>({
    type: 'success',
    title: '',
    message: ''
  });

  const showModal = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalOpen(true);
  };

  // 📋 Source of Truth: The URL
  const getRoleFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("role");
    return (r === 'PACIENTE' || r === 'CUIDADOR') ? r : 'CUIDADOR';
  };

  const role = getRoleFromUrl();

  // 🛡️ EFECTO DE PROTECCIÓN: Si ya está logueado con el rol correcto, saltar login
  useEffect(() => {
    if (user && !authLoading) {
      if (user.role === role) {
        history.replace(role === "CUIDADOR" ? "/care/home" : "/patient/home");
      }
    }
  }, [user, role, history, authLoading]);

  const handleLogin = async () => {
    if (!email || !password) {
      showModal('warning', 'Campos vacíos', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const response: any = await authLogin(email, password);
      const loggedUser = response?.user ?? null;

      if (!loggedUser) {
        showModal('error', 'Error', 'El servidor no devolvió información del usuario.');
        return;
      }

      if (!loggedUser.password) {
        showModal('warning', 'Sin Contraseña', 'Esta cuenta usa Google. Debes crear una contraseña primero.');
        history.push("/password");
        return;
      }

      // 🟩 Usuario sin rol (primera vez)
      if (!loggedUser.role) {
        try {
          const res = await api.post("/auth/set-role", { role: role });
          if (res.data?.accessToken) {
            localStorage.setItem("token", res.data.accessToken);
            window.location.href = role === 'CUIDADOR' ? "/care/home" : "/patient/home";
            return;
          }
        } catch (err) {
          console.error("Error auto-asignando rol:", err);
        }
        history.push("/selectrole");
        return;
      }

      // Redirección normal según rol ya asignado
      history.push(loggedUser.role === "CUIDADOR" ? "/care/home" : "/patient/home");

    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al iniciar sesión";
      showModal('error', 'Fallo de acceso', msg === 'Unauthorized' ? 'Credenciales incorrectas' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className={`login-page ${role === 'PACIENTE' ? 'patient-theme' : ''}`}>

        <div className="top-shape"></div>
        <div className="bottom-shape"></div>

        <div className="login-container">
          <h1 className="title" style={{ fontSize: '3rem', marginBottom: '4px' }}>pastibot</h1>
          <p className="subtitle" style={{ marginBottom: '35px' }}>
            Inicia sesión como <strong style={{ color: role === 'PACIENTE' ? '#e65100' : 'var(--primary)' }}>
              {role === 'CUIDADOR' ? 'Cuidador' : 'Paciente'}
            </strong>
          </p>

          <IonInput
            className="input"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onIonChange={(e) => setEmail(e.detail.value || "")}
          />

          <IonInput
            className="input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value || "")}
          />

          <div style={{ textAlign: 'right', width: '100%', marginBottom: '25px' }}>
            <a href="/forgot" className="forgot" style={{ margin: 0, fontWeight: 700 }}>¿Olvidaste tu contraseña?</a>
          </div>

          <IonButton expand="block" className="signin-btn" onClick={handleLogin} disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </IonButton>

          <div style={{ marginTop: '20px' }}>
            <p className="signup-text">
              ¿No tienes una cuenta?{" "}
              {role === "PACIENTE" ? (
                <span className="link" onClick={() => history.push("/register?role=PACIENTE")}>
                  Regístrate aquí
                </span>
              ) : (
                <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  Registro solo para pacientes
                </span>
              )}
            </p>
            <a
              onClick={() => history.push("/welcome")}
              style={{ fontSize: '0.85rem', color: '#90a4ae', textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              ← ¿No eres {role === 'CUIDADOR' ? 'cuidador' : 'paciente'}? Cambiar rol
            </a>
          </div>

          <div className="divider">O inicia sesión con</div>

          <div className="socials">
            <FcGoogle
              className="social-icon google"
              onClick={() => {
                const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
                window.location.href = `${baseUrl}/auth/google?role=${role}`;
              }}
            />
            <FaFacebook
              className="social-icon facebook"
              onClick={() => {
                const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
                window.location.href = `${baseUrl}/auth/facebook?role=${role}`;
              }}
            />
            <FaSquareXTwitter className="social-icon twitter" />
          </div>
        </div>

        <StatusModal
          isOpen={modalOpen}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={() => setModalOpen(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
