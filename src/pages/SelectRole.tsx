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
  const [caregiverCode, setCaregiverCode] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"care" | "patient" | null>(null);

  // 🛡️ Si el usuario ya tiene rol, no dejarle estar aquí
  React.useEffect(() => {
    if (user && user.role) {
      window.location.href = user.role === "CUIDADOR" ? "/care/home" : "/patient/home";
    }
  }, [user]);

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

    if (backendRole === 'PACIENTE' && !caregiverCode) {
      alert("Debes ingresar el código de tu cuidador.");
      return;
    }

    try {
      // Guardar el rol en la BD
      const res = await api.post(
        "/auth/set-role",
        {
          role: backendRole,
          caregiverCode: backendRole === 'PACIENTE' ? caregiverCode : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ ACTUALIZAR TOKEN Y ESTADO
      if (res.data?.accessToken) {
        localStorage.setItem("token", res.data.accessToken);
        window.location.href = selectedRole === "care" ? "/care/home" : "/patient/home";
        return;
      }

      history.push(selectedRole === "care" ? "/care/home" : "/patient/home");

    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || "Error al guardar el rol";
      alert(msg);
      // No cerramos el modal si hay error para que pueda corregir el código
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
          <div className="modal-content" style={{ padding: '25px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px' }}>
              Confirmar como {selectedRole === 'care' ? 'Cuidador' : 'Paciente'}
            </h2>

            <p style={{ color: '#666', marginBottom: '20px' }}>
              {selectedRole === "care"
                ? "Tendrás acceso a la gestión de todos los pacientes y el robot."
                : "Necesitas vincularte a un cuidador para recibir tus medicinas."}
            </p>

            {selectedRole === 'patient' && (
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="CÓDIGO DEL CUIDADOR"
                  value={caregiverCode}
                  onChange={(e) => setCaregiverCode(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: '12px',
                    border: '2px solid #FF7043',
                    fontSize: '1.1rem',
                    textAlign: 'center',
                    fontWeight: 900,
                    letterSpacing: '2px'
                  }}
                />
                <p style={{ fontSize: '0.8rem', color: '#FF7043', marginTop: '8px', fontWeight: 600 }}>
                  ⚠️ Pide el código de 6 letras a tu cuidador.
                </p>
              </div>
            )}

            <div className="modal-buttons" style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#f1f5f9', border: 'none', fontWeight: 700 }}
              >
                Cancelar
              </button>
              <button
                className="btn-confirm"
                onClick={confirmRole}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: selectedRole === 'care' ? 'var(--primary)' : '#F4511E',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default SelectRole;
