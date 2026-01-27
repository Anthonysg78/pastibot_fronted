import React, { useState } from "react";
import { IonPage, IonContent, IonInput, IonButton, IonItem, IonLabel, IonSelect, IonSelectOption } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StatusModal from "../components/StatusModal";
import "./CompleteProfile.css";

const CompleteProfile: React.FC = () => {
    const history = useHistory();
    const { user, getProfile } = useAuth();

    // Si ya tiene todo, mandar al home
    if (user && user.patientProfile?.age && user.patientProfile?.emergencyPhone) {
        history.replace("/patient/home");
    }

    const [age, setAge] = useState<number | undefined>(user?.patientProfile?.age || undefined);
    const [condition, setCondition] = useState<string>(user?.patientProfile?.condition || "");
    const [emergencyPhone, setEmergencyPhone] = useState<string>(user?.patientProfile?.emergencyPhone || "");
    const [loading, setLoading] = useState(false);

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

    const handleSave = async () => {
        if (!age || !emergencyPhone) {
            showStatus('warning', 'Campos incompletos', 'Por favor ingresa tu edad y teléfono de emergencia.');
            return;
        }

        setLoading(true);
        try {
            await api.patch("/patients/update-my-profile", {
                age: Number(age),
                condition,
                emergencyPhone
            });

            // Refrescar perfil local para que AuthContext sepa que ya está completo
            await getProfile();

            showStatus('success', '¡Perfil Completo!', 'Tus datos han sido guardados. Vamos al inicio.');
            setTimeout(() => {
                history.replace("/patient/home");
            }, 1500);

        } catch (err: any) {
            console.error("Error saving profile:", err);
            const msg = err?.response?.data?.message || err?.message || JSON.stringify(err);
            showStatus('error', 'Error al guardar', `No se pudieron guardar los datos: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage>
            <IonContent fullscreen className="complete-profile-page">
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                    <div className="setup-container">
                        <h1 className="setup-title">¡Casi listos! 📝</h1>
                        <p className="setup-subtitle">Necesitamos unos datos extra para que tu cuidador pueda ayudarte mejor.</p>

                        <div style={{ marginTop: '20px' }}>
                            <IonLabel style={{ marginLeft: '5px', fontWeight: 600, color: '#546e7a' }}>Edad</IonLabel>
                            <IonInput
                                type="number"
                                className="setup-input"
                                placeholder="Ej. 65"
                                value={age}
                                onIonChange={e => setAge(parseInt(e.detail.value!, 10))}
                            />

                            <IonLabel style={{ marginLeft: '5px', fontWeight: 600, color: '#546e7a' }}>Padecimiento / Condición (Opcional)</IonLabel>
                            <IonInput
                                type="text"
                                className="setup-input"
                                placeholder="Ej. Hipertensión, Diabetes..."
                                value={condition}
                                onIonChange={e => setCondition(e.detail.value!)}
                            />

                            <IonLabel style={{ marginLeft: '5px', fontWeight: 600, color: '#546e7a' }}>Teléfono de Emergencia (Familiar) 📞</IonLabel>
                            <IonInput
                                type="tel"
                                className="setup-input"
                                placeholder="Ej. +593 99 999 9999"
                                value={emergencyPhone}
                                onIonChange={e => setEmergencyPhone(e.detail.value!)}
                            />
                        </div>

                        <IonButton expand="block" className="save-btn" onClick={handleSave} disabled={loading}>
                            {loading ? 'Guardando...' : 'Completar Registro'}
                        </IonButton>
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

export default CompleteProfile;
