import React, { useState } from "react";
import { IonContent, IonSpinner, IonPage, IonInput, IonButton } from "@ionic/react";
import { useHistory, useParams } from "react-router-dom";
import { api } from "../api/axios";
import StatusModal from "../components/StatusModal";
import "./Login.css";

const ResetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const history = useHistory();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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

        if (password.length < 8) {
            showModal('warning', 'Contraseña corta', 'La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            showModal('warning', 'Error de coincidencia', 'Las contraseñas no son iguales.');
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/reset-password", { token, password });
            showModal('success', '¡Éxito!', 'Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión.');
        } catch (err: any) {
            showModal('error', 'Error', err.response?.data?.message || "No se pudo restablecer la contraseña.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage>
            <IonContent fullscreen className="login-page">
                <div className="login-bubble b1"></div>
                <div className="login-bubble b2"></div>

                <div className="login-container">
                    <h1 className="title" style={{ fontSize: '2.5rem' }}>Nueva Contraseña</h1>
                    <p className="subtitle">Configura tu acceso de seguridad</p>

                    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                        <IonInput
                            type="password"
                            placeholder="Nueva contraseña"
                            value={password}
                            onIonChange={e => setPassword(e.detail.value || "")}
                            className="input"
                            style={{ marginBottom: '15px' }}
                        />

                        <IonInput
                            type="password"
                            placeholder="Confirmar contraseña"
                            value={confirmPassword}
                            onIonChange={e => setConfirmPassword(e.detail.value || "")}
                            className="input"
                        />

                        <IonButton expand="block" type="submit" className="signin-btn" style={{ marginTop: '30px' }} disabled={loading}>
                            {loading ? <IonSpinner name="dots" /> : "RESTABLECER ACCESO"}
                        </IonButton>
                    </form>
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

export default ResetPassword;
