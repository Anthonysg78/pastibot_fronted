import React, { useState, useEffect } from "react";
import { IonPage, IonContent, IonModal } from "@ionic/react";
import { FaUserNurse } from "react-icons/fa";
import { FaUser } from "react-icons/fa6";
import { useHistory } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/axios";
import StatusModal from "../components/StatusModal";
import "./SelectRole.css";

const SelectRole: React.FC = () => {
  const history = useHistory();
  const { user, getProfile, loading: authLoading } = useAuth();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"care" | "patient" | null>(null);
  const [caregiverCode, setCaregiverCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Status Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ type: 'success' | 'error' | 'warning', title: string, message: string }>({
    type: 'success',
    title: '',
    message: ''
  });

  const showStatus = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalOpen(true);
  };

  // 🛡️ Si el usuario ya tiene rol, no dejarle estar aquí
  useEffect(() => {
    if (user && user.role && !authLoading) {
      if (user.role === "PACIENTE") {
        const p = user.patientProfile;
        if (!p || !p.age || !p.emergencyPhone) {
          history.replace("/complete-profile");
          return;
        }
        history.replace("/patient/home");
      } else {
        history.replace("/care/home");
      }
    }

    // 🔥 AUTO-DETECTAR ROL SI VIENE DE LOGIN/REGISTER
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role");
    if (roleParam === "PACIENTE") {
      setSelectedRole("patient");
      setShowConfirmModal(true);
    } else if (roleParam === "CUIDADOR") {
      setSelectedRole("care");
      setShowConfirmModal(true);
    }
  }, [user, authLoading]);

  const handleSelect = (role: "care" | "patient") => {
    setSelectedRole(role);
    setShowConfirmModal(true);
  };

  const confirmRole = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      showStatus('error', 'Sesión expirada', 'Debes volver a iniciar sesión.');
      history.push("/login");
      return;
    }

    const backendRole = selectedRole === "care" ? "CUIDADOR" : "PACIENTE";

    if (backendRole === 'PACIENTE' && !caregiverCode) {
      showStatus('warning', 'Código faltante', 'Por favor ingresa el código de tu cuidador.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(
        "/auth/set-role",
        {
          role: backendRole,
          caregiverCode: backendRole === 'PACIENTE' ? caregiverCode : undefined
        }
      );

      if (res.data?.accessToken) {
        localStorage.setItem("token", res.data.accessToken);
        // Si es PACIENTE, siempre mandarlo a completar perfil porque acaba de nacer
        if (backendRole === 'PACIENTE') {
          showStatus('success', '¡Rol asignado!', 'Ahora completa tus datos médicos.');
          setTimeout(() => {
            window.location.href = "/complete-profile";
          }, 1500);
        } else {
          showStatus('success', '¡Rol asignado!', 'Bienvenido a Pastibot.');
          setTimeout(() => {
            window.location.href = "/care/home";
          }, 1500);
        }
      } else {
        if (backendRole === 'PACIENTE') {
          history.push("/complete-profile");
        } else {
          history.push("/care/home");
        }
      }

    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || "Ocurrió un error al guardar tu rol.";
      showStatus('error', 'Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="selectrole-page">
        <div className="top-gradient"></div>
        <div className="bottom-gradient"></div>

        <div className="role-container">
          <h1 className="title">Elige tu Rol</h1>
          <p className="subtitle">Selecciona cómo quieres utilizar Pastibot</p>

          <div className="role-buttons">
            <div className="role-card cuidador" onClick={() => handleSelect("care")}>
              <FaUserNurse className="role-icon" />
              <h2>Cuidador</h2>
              <p>Control total del robot y pacientes</p>
            </div>

            <div className="role-card paciente" onClick={() => handleSelect("patient")}>
              <FaUser className="role-icon" />
              <h2>Paciente</h2>
              <p>Recibe tus recordatorios y tomas</p>
            </div>
          </div>
        </div>

        {/* MODAL DE CONFIRMACIÓN CUSTOM */}
        <IonModal isOpen={showConfirmModal} onDidDismiss={() => setShowConfirmModal(false)} className="confirm-modal">
          <div className="modal-content" style={{ padding: '30px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '15px' }}>
              Confirmar como {selectedRole === 'care' ? 'Cuidador' : 'Paciente'}
            </h2>

            <p style={{ color: '#64748b', marginBottom: '25px', lineHeight: '1.5' }}>
              {selectedRole === "care"
                ? "Como cuidador, podrás gestionar medicinas, pacientes y el robot de forma remota."
                : "Como paciente, recibirás notificaciones en tiempo real y el robot se acercará a entregarte tu medicina."}
            </p>

            {selectedRole === 'patient' && (
              <div style={{ marginBottom: '25px' }}>
                <input
                  type="text"
                  placeholder="CÓDIGO DEL CUIDADOR"
                  value={caregiverCode}
                  onChange={(e) => setCaregiverCode(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '2px solid #F4511E',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    fontWeight: 900,
                    letterSpacing: '3px',
                    background: '#FFF3E0'
                  }}
                />
                <p style={{ fontSize: '0.85rem', color: '#F4511E', marginTop: '10px', fontWeight: 700 }}>
                  ⚠️ Ingresa el código de 6 letras de tu cuidador.
                </p>
              </div>
            )}

            <div className="modal-buttons" style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn-cancel"
                onClick={() => setShowConfirmModal(false)}
                style={{ flex: 1, padding: '15px', borderRadius: '16px', background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 700 }}
              >
                Cancelar
              </button>
              <button
                className="btn-confirm"
                onClick={confirmRole}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '15px',
                  borderRadius: '16px',
                  background: selectedRole === 'care' ? 'var(--primary)' : '#F4511E',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                }}
              >
                {loading ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </IonModal>

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

export default SelectRole;
