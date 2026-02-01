import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { IonPage, IonContent, IonButton } from "@ionic/react";
import { FaFacebook } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";

import { useAuth } from "../context/AuthContext";
import StatusModal from "../components/StatusModal";
import "./Register.css";

const Register: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, register: authRegister, loginWithGoogle, loginWithFacebook, loading: authLoading } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const [role, setRole] = useState(queryParams.get("role") || "PACIENTE"); // CUIDADOR o PACIENTE

  useEffect(() => {
    const r = queryParams.get("role");
    if (r) setRole(r);
  }, [location.search]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [caregiverCode, setCaregiverCode] = useState("");
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

  // 🛡️ Si ya hay sesión, no registrarse otra vez
  useEffect(() => {
    if (user && !authLoading) {
      if (user.role) {
        history.replace(user.role === "CUIDADOR" ? "/care/home" : "/patient/home");
      } else {
        history.replace("/selectrole?role=" + role);
      }
    }
  }, [user, history, authLoading]);

  const validarFormulario = () => {
    if (role === 'CUIDADOR') {
      showModal('error', 'Acceso denegado', 'El registro de cuidadores está deshabilitado. Usa la cuenta maestra.');
      return false;
    }

    if (!name || !email || !pass || !confirm) {
      showModal('warning', 'Campos vacíos', 'Completa todos los campos para continuar.');
      return false;
    }

    if (role === 'PACIENTE' && !caregiverCode) {
      showModal('warning', 'Código requerido', 'Debes ingresar el código de tu cuidador para vincularte.');
      return false;
    }

    if (/\d/.test(name)) {
      showModal('warning', 'Nombre inválido', 'El nombre no debe contener números.');
      return false;
    }

    if (!email.includes("@") || !email.includes(".")) {
      showModal('warning', 'Email inválido', 'Ingresa un correo electrónico profesional válido.');
      return false;
    }

    if (pass.length < 8) {
      showModal('warning', 'Contraseña corta', 'La contraseña debe tener al menos 8 caracteres por seguridad.');
      return false;
    }

    if (pass !== confirm) {
      showModal('warning', 'Error de coincidencia', 'Las contraseñas no son iguales.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      await authRegister({
        name,
        email,
        password: pass,
        gender: null,
        role: role as any,
        caregiverCode: role === 'PACIENTE' ? caregiverCode : undefined
      });

      showModal('success', '¡Cuenta creada!', 'Te has registrado correctamente en Pastibot.');
      // La redirección ocurrirá vía useEffect cuando el user se actualice
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al registrar usuario.";
      showModal('error', 'Error de registro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className={`register-page ${role === 'PACIENTE' ? 'patient-theme' : ''}`}>
        <div className="top-shape"></div>
        <div className="bottom-shape"></div>

        <div className="register-container">
          <h1 className="title">
            {role === 'CUIDADOR' ? 'Registro Cuidador' : 'Crear Cuenta'}
          </h1>
          <p className="subtitle">
            {role === 'PACIENTE' ? 'Únete a tu cuidador para empezar' : 'Regístrate para cuidar a tus seres queridos'}
          </p>

          <form className="register-form" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {role === 'PACIENTE' && (
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="CÓDIGO CUIDADOR (Ej: PASTIBOT)"
                  value={caregiverCode}
                  onChange={(e) => setCaregiverCode(e.target.value.toUpperCase())}
                  style={{ border: '2px solid #E65100', fontWeight: 'bold', textAlign: 'center', letterSpacing: '2px' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#E65100', marginTop: '5px', textAlign: 'center', fontWeight: 600 }}>
                  ⚠️ Necesitas el código que te dio tu cuidador.
                </p>
              </div>
            )}

            <input
              type="password"
              placeholder="Contraseña"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            <IonButton
              expand="block"
              className="register-btn"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'CREAR UNA CUENTA'}
            </IonButton>
          </form>

          <p className="signin-text">
            ¿Ya tienes una cuenta?{" "}
            <span
              className="link"
              onClick={() => history.push(`/login?role=${role.toLowerCase()}`)}
            >
              Iniciar sesión
            </span>
          </p>

          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <a
              onClick={() => {
                const newRole = role === 'CUIDADOR' ? 'PACIENTE' : 'CUIDADOR';
                setRole(newRole);
                history.replace(`/register?role=${newRole}`);
              }}
              style={{ fontSize: '0.85rem', color: '#90a4ae', textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              ← ¿No quieres ser {role === 'CUIDADOR' ? 'cuidador' : 'paciente'}? Cambiar a {role === 'CUIDADOR' ? 'Paciente' : 'Cuidador'}
            </a>
          </div>

          <div className="divider">O regístrate con</div>

          <div className="socials">
            <FcGoogle
              className="social-icon google"
              onClick={async () => {
                try {
                  localStorage.setItem("pendingRole", role); // 💾 Guardamos el rol elegido
                  await loginWithGoogle();
                } catch (err: any) {
                  console.error("Firebase Google Error details:", err);
                  const msg = err?.message || JSON.stringify(err);
                  showModal('error', 'Error', `No se pudo registrar con Google: ${msg}`);
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
                  showModal('error', 'Error', 'No se pudo registrar con Facebook.');
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

export default Register;
