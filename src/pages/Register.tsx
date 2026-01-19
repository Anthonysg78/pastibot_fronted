import React, { useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { IonPage, IonContent } from "@ionic/react";
import { FaFacebook } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";

import { api, setAuthToken } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

const Register: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, register: authRegister } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get("role"); // CUIDADOR o PACIENTE

  // 🛡️ Si ya hay sesión, no registrarse otra vez
  React.useEffect(() => {
    if (user) {
      history.replace(role === "CUIDADOR" ? "/care/home" : "/patient/home");
    }
  }, [user, history, role]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [caregiverCode, setCaregiverCode] = useState("");

  const [error, setError] = useState("");

  const validarFormulario = () => {
    setError("");

    if (role === 'CUIDADOR') {
      setError("El registro de cuidadores está deshabilitado.");
      return false;
    }

    if (role === 'PACIENTE' && !caregiverCode) {
      setError("Debes ingresar el código de tu cuidador.");
      return false;
    }

    if (/\d/.test(name)) {
      setError("El nombre no puede contener números.");
      return false;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Ingresa un correo electrónico válido.");
      return false;
    }

    if (pass.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }

    if (pass !== confirm) {
      setError("Las contraseñas no coinciden.");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validarFormulario()) return;

    try {
      await authRegister({
        name,
        email,
        password: pass,
        gender: null,
        role: role || null,
        caregiverCode: role === 'PACIENTE' ? caregiverCode : undefined
      });

      // Redirigimos según el rol
      if (role === "CUIDADOR") {
        history.push("/care/home");
      } else {
        history.push("/patient/home");
      }

    } catch (err: any) {
      const msg = err?.response?.data?.message;

      if (msg?.includes("El correo ya está registrado")) {
        setError("Ese correo ya está en uso.");
        return;
      }

      if (msg?.includes("El código de cuidador")) {
        setError(msg);
        return;
      }

      console.log(err);
      setError("Error al registrar usuario.");
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className={`register-page ${role === 'PACIENTE' ? 'patient-theme' : ''}`}>
        <div className="top-shape"></div>
        <div className="bottom-shape"></div>

        <div className="register-container">
          <h1 className="title">
            {role === 'CUIDADOR' ? 'Registro Cuidador' : role === 'PACIENTE' ? 'Registro Paciente' : 'Crear cuenta'}
          </h1>
          <p className="subtitle">
            {role === 'PACIENTE' ? 'Únete a tu cuidador para empezar' : 'Regístrate para empezar a usar Pastibot'}
          </p>

          {role === 'PACIENTE' && (
            <div style={{ background: '#FFF3E0', padding: '10px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem', color: '#E65100', border: '1px solid #FFE0B2' }}>
              ⚠️ Necesitas el código de 6 letras (ej. PASTIBOT) que te dio tu cuidador.
            </div>
          )}

          {error && (
            <p style={{ color: "red", marginBottom: 10 }}>{error}</p>
          )}

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
              <input
                type="text"
                placeholder="Código del Cuidador (Ejem: PASTIBOT)"
                value={caregiverCode}
                onChange={(e) => setCaregiverCode(e.target.value.toUpperCase())}
                style={{ border: '2px solid #E65100', fontWeight: 'bold' }}
              />
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

            <button
              type="button"
              className="register-btn"
              onClick={handleRegister}
            >
              CREAR UNA CUENTA
            </button>
          </form>

          <p className="signin-text">
            ¿Ya tienes una cuenta?{" "}
            <span
              className="link"
              onClick={() => history.push("/login" + (role ? `?role=${role}` : ""))}
            >
              Iniciar sesión
            </span>
          </p>

          <div className="divider">O regístrate con</div>

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
      </IonContent>
    </IonPage>
  );
};

export default Register;
