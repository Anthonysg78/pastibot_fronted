import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { IonPage, IonContent, IonInput, IonButton, useIonViewWillEnter } from "@ionic/react";
import { FcGoogle } from "react-icons/fc";

import { useAuth } from "../context/AuthContext";
import { api } from "../api/axios";
import StatusModal from "../components/StatusModal";
import "./Login.css";

const Login: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { login: authLogin, loginWithGoogle, user, loading: authLoading } = useAuth();

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

  // 🛡️ EFECTO DE PROTECCIÓN: Si ya está logueado, redirigir según su estado
  useEffect(() => {
    const checkUserRole = async () => {
      if (user && !authLoading) {
        if (user.role) {
          if (user.role === "PACIENTE") {
            const p = user.patientProfile;
            const isLinked = p?.caregiverId || p?.linkCode || p?.emergencyPhone;

            if (!isLinked) {
              if (!p || !p.age) {
                history.replace("/complete-profile");
                return;
              }
            }
            history.replace("/patient/home");
          } else {
            history.replace("/care/home");
          }
        } else {
          // 🚀 Si NO tiene rol (caso raro ahora), mandarlo a completar como PACIENTE
          history.replace("/complete-profile");
        }
      }
    };
    checkUserRole();
  }, [user, history, authLoading]);

  const handleLogin = async () => {
    if (!email || !password) {
      showModal('warning', 'Campos vacíos', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await authLogin(email, password);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al iniciar sesión";
      showModal('error', 'Fallo de acceso', msg === 'Unauthorized' ? 'Credenciales incorrectas' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-page">

        <div className="top-shape"></div>
        <div className="bottom-shape"></div>

        <div className="login-container">
          <h1 className="title" style={{ fontSize: '3rem', marginBottom: '4px' }}>pastibot</h1>
          <p className="subtitle" style={{ marginBottom: '35px' }}>
            Inicia sesión para continuar
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

          <p className="signup-text">
            ¿No tienes cuenta? <span className="link" onClick={() => history.push("/register")}>Regístrate aquí</span>
            <br />
            <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.75rem', marginTop: '5px', display: 'block' }}>
              (El registro es automático al iniciar con Google)
            </span>
          </p>
        </div>
        <div className="divider">O inicia sesión con</div>

        <div className="socials" style={{ justifyContent: 'center' }}>
          <FcGoogle
            className="social-icon google"
            onClick={async () => {
              try {
                await loginWithGoogle();
              } catch (err: any) {
                console.error("Firebase Google Error:", err);
                const detailedError = err?.response?.data?.message || err?.message || JSON.stringify(err);
                showModal('error', 'Error Google', `No se pudo iniciar sesión: ${detailedError}`);
              }
            }}
          />
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
