import React, { useState } from "react";
import { IonPage, IonContent, IonModal } from "@ionic/react";
import { FaUserNurse } from "react-icons/fa";
import { FaUser } from "react-icons/fa6";
import { useHistory, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/axios";
import "./SelectRole.css";

const SelectRole: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth(); // 👈 Usar contexto real
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"care" | "patient" | null>(null);

  // 🛡️ Si el usuario ya tiene rol, no dejarle estar aquí
  React.useEffect(() => {
    if (user && user.role) {
      history.replace(user.role === "CUIDADOR" ? "/care/home" : "/patient/home");
    }
  }, [user, history]);

  const handleSelect = (role: "care" | "patient") => {
    setSelectedRole(role);
    setShowModal(true);
  };

  // ============================================================
  // 🚀 GUARDAR EL ROL EN EL BACKEND
  // ============================================================
  const confirmRole = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("No autorizado");
      return;
    }

    const backendRole =
      selectedRole === "care" ? "CUIDADOR" : "PACIENTE";

    try {
      // Guardar el rol en la BD
      const res = await api.post(
        "/auth/set-role",
        { role: backendRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ ACTUALIZAR TOKEN Y ESTADO (Muy importante para persistir el rol)
      if (res.data?.accessToken) {
        localStorage.setItem("token", res.data.accessToken);
        // Podríamos llamar a getProfile() aquí si lo tuviéramos expuesto, 
        // pero forzaremos una recarga al navegar o el AuthContext se actualizará solo si recargamos.
        // Mejor opción: Forzar recarga completa para asegurar estado limpio.
        window.location.href = selectedRole === "care" ? "/care/home" : "/patient/home";
        return;
      }

      // Fallback si no hay token nuevo (no debería pasar)
      if (selectedRole === "care") {
        history.push("/login?role=" + selectedRole);
      } else {
        history.push("/patient/home");
      }

    } catch (err) {
      console.error(err);
      alert("Error al guardar el rol");
      setShowModal(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="selectrole-page">
        <div className="top-gradient"></div>
        <div className="bottom-gradient"></div>

        <div className="role-bubble" style={{ width: '100px', height: '100px', top: '15%', left: '10%' }}></div>
        <div className="role-bubble" style={{ width: '60px', height: '60px', bottom: '20%', right: '15%', animationName: 'floatAnimReverse' }}></div>
        <div className="role-bubble" style={{ width: '40px', height: '40px', top: '40%', right: '10%' }}></div>

        <div className="role-container">
          <h1 className="title">Elige tu Rol</h1>
          <p className="subtitle">Selecciona cómo quieres utilizar Pastibot</p>

          <div className="role-buttons">
            <div className="role-card cuidador" onClick={() => handleSelect("care")}>
              <FaUserNurse className="role-icon" />
              <h2>Cuidador</h2>
              <p>Control total del robot y pacientes</p>
            </div>

            <div className="role-card paciente" onClick={() => handleSelect("patient")} style={{
              background: 'linear-gradient(135deg, #FF7043, #F4511E)',
              boxShadow: '0 8px 20px rgba(244, 81, 30, 0.2)'
            }}>
              <FaUser className="role-icon" />
              <h2>Paciente</h2>
              <p>Recibe tus recordatorios y tomas</p>
            </div>
          </div>
        </div>

        <IonModal isOpen={showModal} className="confirm-modal" onDidDismiss={() => setShowModal(false)}>
          <div className="modal-content">
            <h2>¿Confirmar rol?</h2>
            <p>
              {selectedRole === "care"
                ? "¿Deseas continuar como Cuidador?"
                : "¿Deseas continuar como Paciente?"}
            </p>

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Atrás
              </button>
              <button className="btn-confirm" onClick={confirmRole}>
                Sí, continuar
              </button>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default SelectRole;
