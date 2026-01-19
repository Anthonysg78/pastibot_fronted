import React, { useState } from "react";
import { IonPage, IonContent, IonSpinner } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { api } from "../api/axios";
import "./ForgotPassword.css";

const ForgotPassword: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Ingresa tu correo electrónico");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSent(true);
      // En desarrollo, mostramos el link en consola
      if (res.data.resetLink) {
        console.log("Link de recuperación:", res.data.resetLink);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al enviar solicitud");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <IonPage>
        <IonContent fullscreen className="forgot-page">
          <div className="top-shape"></div>
          <div className="bottom-shape"></div>
          <div className="forgot-container">
            <h1 className="title">📧 Revisa tu correo</h1>
            <p className="subtitle">
              Si el correo existe, recibirás un enlace para restablecer tu contraseña.
            </p>
            <p className="back-login" onClick={() => history.push("/login")}>
              ← Volver al Login
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen className="forgot-page">
        <div className="top-shape"></div>
        <div className="bottom-shape"></div>

        <div className="forgot-container">
          <h1 className="title">¿Olvidaste tu contraseña?</h1>
          <p className="subtitle">
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </p>

          <form className="forgot-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            {error && <p style={{ color: "#ff4444", fontSize: "0.9rem" }}>{error}</p>}

            <button type="submit" className="forgot-btn" disabled={loading}>
              {loading ? <IonSpinner name="crescent" /> : "ENVIAR ENLACE"}
            </button>
          </form>

          <p className="back-login" onClick={() => history.push("/login")}>
            ← Volver al Login
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
