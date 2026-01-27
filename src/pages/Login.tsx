import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { IonPage, IonContent, IonInput, IonButton, useIonViewWillEnter } from "@ionic/react";
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
  const { login: authLogin, loginWithGoogle, loginWithFacebook, user, loading: authLoading } = useAuth();

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

  const [role, setRole] = useState<string>('CUIDADOR');

  // 🔄 Force update role on mount and when location changes
  const updateRole = () => {
    const params = new URLSearchParams(location.search);
    const r = params.get("role")?.toUpperCase();
    console.log("LOGIN ROUTE UPDATE:", location.search, "Found:", r);
    setRole((r === 'PACIENTE' || r === 'CUIDADOR') ? r : 'CUIDADOR');
  };

  useEffect(() => {
    updateRole();
  }, [location.search]);

  // ⚡ Ionic Lifecycle: Ensure it runs even if page is cached
  useIonViewWillEnter(() => {
    updateRole();
  });

  // 🛡️ EFECTO DE PROTECCIÓN: Si ya está logueado, redirigir según su estado
  // 🛡️ EFECTO DE PROTECCIÓN: Si ya está logueado, redirigir según su estado
  useEffect(() => {
    const checkUserRole = async () => {
      if (user && !authLoading) {
        if (user.role) {
          if (user.role === "PACIENTE") {
            const p = user.patientProfile;
            console.log("LOGIN CHECK - User:", user);
            console.log("LOGIN CHECK - Patient Profile:", p);
            if (!p || !p.age || !p.emergencyPhone) {
              history.replace("/complete-profile");
              return;
            }
            history.replace("/patient/home");
          } else {
            history.replace("/care/home");
          }
        } else {
          // 🚀 AUTO-ASSIGN ROLE: Si no tiene rol pero sabemos cual quiere
          if (role === 'PACIENTE' || role === 'CUIDADOR') {
            console.log(`[AUTO-ROLE] Asignando rol ${role} automáticamente...`);
            try {
              await api.post('/auth/set-role', { role });
              // Refrescamos el usuario para que el context tenga el rol nuevo
              // NOTA: AuthContext expone getProfile? Sí, lo importamos del hook
              window.location.reload(); // Manera segura de recargar todo el estado limpio
            } catch (error) {
              console.error("Error auto-asignando rol:", error);
              history.replace("/select-role?role=" + role);
            }
          } else {
            history.replace("/select-role?role=" + role);
          }
        }
      }
    };
    checkUserRole();
  }, [user, history, authLoading, role]);

  const handleLogin = async () => {
    if (!email || !password) {
      showModal('warning', 'Campos vacíos', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const response: any = await authLogin(email, password);
      // El useEffect se encargará de la redirección al actualizarse el 'user'
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
            <FaFacebook
              className="social-icon facebook"
              onClick={async () => {
                try {
                  await loginWithFacebook();
                } catch (err) {
                  console.error("Firebase Facebook Error:", err);
                  showModal('error', 'Error', 'No se pudo iniciar sesión con Facebook.');
                }
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
