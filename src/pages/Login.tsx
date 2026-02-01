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

  // 🚀 LAZY INIT: Leer URL directamente al iniciar para evitar flash de "CUIDADOR"
  const [role, setRole] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("role")?.toUpperCase();
    return (r === 'PACIENTE' || r === 'CUIDADOR') ? r : 'CUIDADOR';
  });

  // 🔄 Force update role on mount and when location changes
  const updateRole = () => {
    const params = new URLSearchParams(location.search);
    const r = params.get("role")?.toUpperCase();
    console.log("LOGIN ROUTE UPDATE:", location.search, "Found:", r);
    if (r === 'PACIENTE' || r === 'CUIDADOR') {
      setRole(r);
    }
  };

  useEffect(() => {
    updateRole();
  }, [location.search]);

  // ⚡ Ionic Lifecycle: Ensure it runs even if page is cached
  useIonViewWillEnter(() => {
    updateRole();
  });

  // 🛡️ EFECTO DE PROTECCIÓN: Si ya está logueado, redirigir según su estado
  useEffect(() => {
    const checkUserRole = async () => {
      if (user && !authLoading) {
        if (user.role) {
          if (user.role === "PACIENTE") {
            const p = user.patientProfile;
            console.log("LOGIN CHECK - User:", user);
            console.log("LOGIN CHECK - Patient Profile:", p);
            // Verificar si le faltan datos O si le falta CUIDADOR
            // Si tiene caregiverId o linkCode, asumimos que ya pasó el setup inicial
            const isLinked = p?.caregiverId || p?.linkCode || p?.emergencyPhone;

            if (!isLinked) {
              console.log("LOGIN CHECK - Patient incomplete, forcing SelectRole to link.");
              // Si le falta vinculación, lo mandamos a SelectRole para que ponga el código
              // OJO: Si ya tiene ROL pero no CUIDADOR, quizás deberíamos mandarlo a una pantalla de "Vincular"
              // Pero por ahora, SelectRole maneja la entrada de código.
              // Sin embargo, SelectRole redirige si ya tienes rol...
              // El usuario dijo: "si ya esta asociado... no me tiene que volver a pedir nada"
              // Entonces: Solo pedir si NO está asociado.

              // Problema: SelectRole te saca si ya tienes rol. 
              // Solución rápida: Si tiene rol pero no cuidador, CompleteProfile debería pedir el código? 
              // O SelectRole debería permitir quedarse si falta el código?

              // Por simplicidad: Si ya tiene rol PAGIENTE, asumimos que completó o está en ello en CompleteProfile.
              // El usuario se queja de que LO VUELVE A PEDIR.
              // Si ya tiene rol, el bloque IF (user.role === 'PACIENTE') se ejecuta.
              // Aquí solo validamos perfil médico.
              if (!p || !p.age) {
                history.replace("/complete-profile");
                return;
              }
            }
            console.log("LOGIN CHECK - Patient OK. Going Home.");
            history.replace("/patient/home");
          } else {
            history.replace("/care/home");
          }
        } else {
          // 🚀 Si NO tiene rol, preguntar
          history.replace("/selectrole?role=" + (role || ""));
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

          <p className="signup-text">
            {role === 'PACIENTE' ? (
              <>
                ¿No tienes cuenta? <span className="link" onClick={() => history.push("/register?role=PACIENTE")}>Regístrate aquí</span>
                <br />
                <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.75rem', marginTop: '5px', display: 'block' }}>
                  (El registro es automático al iniciar con Google)
                </span>
              </>
            ) : (
              <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>
                Registro solo para pacientes
              </span>
            )}
          </p>
          <a
            onClick={() => {
              const newRole = role === 'CUIDADOR' ? 'PACIENTE' : 'CUIDADOR';
              setRole(newRole);
              history.replace(`/login?role=${newRole.toLowerCase()}`);
            }}
            style={{ fontSize: '0.85rem', color: '#90a4ae', textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            ← ¿No eres {role === 'CUIDADOR' ? 'cuidador' : 'paciente'}? Cambiar a {role === 'CUIDADOR' ? 'Paciente' : 'Cuidador'}
          </a>
        </div>
        <div className="divider">O inicia sesión con</div>

        <div className="socials" style={{ justifyContent: 'center' }}>
          <FcGoogle
            className="social-icon google"
            onClick={async () => {
              try {
                localStorage.setItem("pendingRole", role); // 💾 Guardamos el rol elegido
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
