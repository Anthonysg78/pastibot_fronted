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
  const { user, register: authRegister, loginWithGoogle, loading: authLoading } = useAuth();

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

  // 🛡️ Si ya hay sesión, redireccionar
  useEffect(() => {
    if (user && !authLoading) {
      if (user.role) {
        history.replace(user.role === "CUIDADOR" ? "/care/home" : "/patient/home");
      } else {
        history.replace("/complete-profile");
      }
    }
  }, [user, history, authLoading]);

  const validarFormulario = () => {
    if (!name || !email || !pass || !confirm || !caregiverCode) {
      showModal('warning', 'Campos vacíos', 'Completa todos los campos, incluyendo el código de tu cuidador.');
      return false;
    }

    if (/\d/.test(name)) {
      showModal('warning', 'Nombre inválido', 'El nombre no debe contener números.');
      return false;
    }

    if (!email.includes("@") || !email.includes(".")) {
      showModal('warning', 'Email inválido', 'Ingresa un correo electrónico válido.');
      return false;
    }

    if (pass.length < 8) {
      showModal('warning', 'Contraseña corta', 'La contraseña debe tener al menos 8 caracteres.');
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
        role: 'PACIENTE',
        caregiverCode: caregiverCode
      });

      showModal('success', '¡Cuenta creada!', 'Te has registrado correctamente como paciente.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al registrar usuario.";
      showModal('error', 'Error de registro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="register-page">
        <div className="top-shape"></div>
        <div className="bottom-shape"></div>

        <div className="register-container">
          <h1 className="title">Crear Cuenta</h1>
          <p className="subtitle">Únete a tu cuidador para empezar</p>

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

          <p className="signin-text" style={{ marginBottom: '20px' }}>
            ¿Ya tienes una cuenta? <span className="link" onClick={() => history.push("/login")}>Iniciar sesión</span>
          </p>

          <div className="divider">O regístrate con</div>

          <div className="socials" style={{ justifyContent: 'center' }}>
            <FcGoogle
              className="social-icon google"
              onClick={async () => {
                try {
                  await loginWithGoogle();
                } catch (err: any) {
                  console.error("Firebase Google Error:", err);
                  const msg = err?.message || JSON.stringify(err);
                  showModal('error', 'Error', `No se pudo registrar con Google: ${msg}`);
                }
              }}
            />
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
