import React, { useState } from "react";
import { IonContent, IonSpinner, IonPage } from "@ionic/react";
import { useHistory, useParams } from "react-router-dom";
import { api } from "../api/axios";
import "./Login.css";

const ResetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const history = useHistory();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/reset-password", { token, password });
            setSuccess(true);
            setTimeout(() => history.push("/login"), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Error al restablecer contraseña");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <IonPage>
                <IonContent fullscreen className="login-page">
                    <div className="login-container">
                        <h1 className="login-title">✅ Contraseña actualizada</h1>
                        <p className="login-subtitle">Redirigiendo al login...</p>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonContent fullscreen className="login-page">
                <div className="login-bubble b1"></div>
                <div className="login-bubble b2"></div>
                <div className="login-bubble b3"></div>

                <div className="login-container">
                    <h1 className="login-title">Nueva contraseña</h1>
                    <p className="login-subtitle">Ingresa tu nueva contraseña</p>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label>Nueva contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirmar contraseña</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Repite tu contraseña"
                                required
                            />
                        </div>

                        {error && <p className="error-text">{error}</p>}

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? <IonSpinner name="crescent" /> : "Cambiar contraseña"}
                        </button>
                    </form>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ResetPassword;
