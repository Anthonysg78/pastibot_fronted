import React, { useState } from "react";
import { IonPage, IonContent, IonSpinner, IonInput, IonButton } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { api } from "../api/axios";
import StatusModal from "../components/StatusModal";
import "./ForgotPassword.css";

const ForgotPassword: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      showModal('warning', 'Email inválido', 'Por favor, ingresa un correo electrónico correcto.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      showModal('success', 'Correo Enviado', 'Si el correo existe, recibirás un enlace para restablecer tu contraseña en unos minutos.');
    } catch (err: any) {
      showModal('error', 'Error', err.response?.data?.message || "No pudimos procesar tu solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="forgot-page">
        <div className="top-shape"></div>
        <div className="bottom-shape"></div>

        <div className="forgot-container">
          <h1 className="title">¿Olvidaste tu contraseña?</h1>
          <p className="subtitle">
            Ingresa tu correo y te enviaremos un enlace de recuperación.
          </p>

          <form className="forgot-form" onSubmit={handleSubmit}>
            <IonInput
              type="email"
              placeholder="Email"
              value={email}
              onIonChange={e => setEmail(e.detail.value || "")}
              className="input-classic"
            />

            <IonButton expand="block" type="submit" className="forgot-btn" disabled={loading}>
              {loading ? <IonSpinner name="dots" /> : "ENVIAR ENLACE"}
            </IonButton>
          </form>

          <p className="back-login" onClick={() => history.push("/login")}>
            ← Volver al Login
          </p>
        </div>

        <StatusModal
          isOpen={modalOpen}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={() => {
            setModalOpen(false);
            if (modalConfig.type === 'success') {
              history.push("/login");
            }
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
