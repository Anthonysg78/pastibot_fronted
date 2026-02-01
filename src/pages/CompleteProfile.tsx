import React, { useState } from "react";
import { IonPage, IonContent, IonInput, IonButton, IonItem, IonLabel, IonSelect, IonSelectOption, IonSpinner } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StatusModal from "../components/StatusModal";
import "./CompleteProfile.css";
import { getRedirectPath } from "../utils/routing";

const CompleteProfile: React.FC = () => {
    const history = useHistory();
    const { user, getProfile } = useAuth();

    // Si ya tiene todo, mandar al home
    if (user) {
        const nextPath = getRedirectPath(user);
        if (nextPath === '/patient/home') {
            history.replace("/patient/home");
        }
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

    const [caregiverCode, setCaregiverCode] = useState("");

    const handleSave = async () => {
        if (!age || !emergencyPhone) {
            showStatus('warning', 'Campos incompletos', 'Por favor ingresa tu edad y teléfono de emergencia.');
            return;
        }

        setLoading(true);
        try {
            // 1. Guardar perfil base
            await api.patch("/patients/update-my-profile", {
                age: Number(age),
                condition,
                emergencyPhone
            });

            // 2. Si puso código, intentar vincular
            // 2. Si puso código, intentar vincular
            if (caregiverCode && caregiverCode.length > 0) {
                try {
                    console.log("Intentando vincular con código:", caregiverCode);
                    await api.post("/patients/link", { code: caregiverCode });
                } catch (linkErr: any) {
                    console.error("Link error:", linkErr);
                    // IMPORTANTE: Si falla el link, AVISAR al usuario y NO redirigir aún.
                    const msg = linkErr?.response?.data?.message || "Código inválido o error de conexión.";
                    showStatus('error', 'Error de Vinculación', msg);
                    setLoading(false); // Detenemos loading para que pueda corregir
                    return; // 🛑 DETENER FLUJO AQUÍ
                }
            }

            // Refrescar perfil local
            await getProfile();

            showStatus('success', '¡Conexión Exitosa!', 'Tu perfil y cuidador han sido vinculados.');
            setTimeout(() => {
                // FORCE RELOAD to ensure AuthContext picks up the new caregiver link
                window.location.href = "/patient/home";
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
                <div className="cp-container center-flex">
                    <div className="cp-card fade-in">
                        <div className="cp-header">
                            <h1 className="cp-title">¡Casi listos! 🚀</h1>
                            <p className="cp-subtitle">Completa tu perfil para que tu cuidador pueda ayudarte mejor.</p>
                        </div>

                        <div className="cp-form">
                            <div className="cp-input-group">
                                <label>Tu Edad</label>
                                <IonInput
                                    type="number"
                                    className="cp-input"
                                    placeholder="Ej. 65"
                                    value={age}
                                    onIonChange={e => setAge(parseInt(e.detail.value!, 10))}
                                />
                            </div>

                            <div className="cp-input-group">
                                <label>Padecimiento (Opcional)</label>
                                <IonInput
                                    type="text"
                                    className="cp-input"
                                    placeholder="Ej. Hipertensión"
                                    value={condition}
                                    onIonChange={e => setCondition(e.detail.value!)}
                                />
                            </div>

                            <div className="cp-input-group">
                                <label>Teléfono de Emergencia</label>
                                <IonInput
                                    type="tel"
                                    className="cp-input"
                                    placeholder="+593 99 999 9999"
                                    value={emergencyPhone}
                                    onIonChange={e => setEmergencyPhone(e.detail.value!)}
                                />
                                <small style={{ display: 'block', marginTop: '5px', color: '#90a4ae', fontSize: '0.8rem' }}>
                                    * Número de un familiar cercano
                                </small>
                            </div>

                            {/* CAREGIVER CODE INPUT */}
                            {!user?.patientProfile?.caregiverId && (
                                <div className="cp-input-group" style={{ marginTop: '25px', background: '#e3f2fd', padding: '15px', borderRadius: '16px', border: '1px dashed #0288d1' }}>
                                    <label style={{ color: '#0277bd' }}>Código de tu Cuidador (Opcional)</label>
                                    <IonInput
                                        type="text"
                                        className="cp-input"
                                        style={{ textAlign: 'center', letterSpacing: '3px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                        placeholder="CÓDIGO"
                                        value={caregiverCode}
                                        onIonChange={e => setCaregiverCode((e.detail.value || "").toUpperCase().trim())}
                                    />
                                    <small style={{ display: 'block', marginTop: '5px', color: '#546e7a', fontSize: '0.75rem' }}>
                                        Si tienes un cuidador, ingresa su código aquí para conectarte.
                                    </small>
                                </div>
                            )}

                            <IonButton expand="block" className="cp-btn" onClick={handleSave} disabled={loading}>
                                {loading ? <IonSpinner name="crescent" /> : 'Guardar y Continuar'}
                            </IonButton>
                        </div>
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
