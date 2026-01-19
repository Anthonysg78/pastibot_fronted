import React from "react";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent } from "@ionic/react";
import { FaUserNurse, FaUser } from "react-icons/fa";
import "./SelectRole.css";

import { useAuth } from "../context/AuthContext";

const Welcome: React.FC = () => {
    const history = useHistory();
    const { user, logout } = useAuth();

    const handleSelect = (role: string) => {
        // 🔥 SI YA HAY SESIÓN Y EL ROL NO COINCIDE, CERRAR SESIÓN PARA EVITAR CONFUSIÓN
        if (user) {
            if (user.role !== role) {
                logout(); // Borrar sesión del cuidador si entra como paciente (o viceversa)
                history.push(`/login?role=${role}`);
                return;
            }
            // Si el rol coincide, ir directo a su home
            history.push(role === 'CUIDADOR' ? "/care/home" : "/patient/home");
            return;
        }

        history.push(`/login?role=${role}`);
    };

    return (
        <IonPage>
            <IonContent fullscreen>
                <div className="bg-mesh" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

                    {/* Floating Orbs */}
                    <div className="role-bubble animate-float" style={{ width: '120px', height: '120px', top: '10%', left: '-20px', animationDelay: '0s' }}></div>
                    <div className="role-bubble animate-float" style={{ width: '80px', height: '80px', bottom: '15%', right: '-10px', animationDelay: '1s', background: 'radial-gradient(circle, rgba(255,112,67,0.2), rgba(255,255,255,0))' }}></div>

                    <div className="role-container animate-fade-in-up">
                        <h1 className="title text-gradient" style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>Pastibot</h1>
                        <p className="subtitle" style={{ fontSize: '1.2rem', marginBottom: '40px', color: '#546e7a' }}>
                            Tu compañero de salud inteligente.<br />
                            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>¿Cómo deseas ingresar?</span>
                        </p>

                        <div className="role-buttons">
                            {/* Card CUIDADOR */}
                            <div
                                className="role-card glass-card shadow-hover"
                                onClick={() => handleSelect("CUIDADOR")}
                                style={{
                                    padding: '25px',
                                    background: 'rgba(255, 255, 255, 0.85)',
                                    marginBottom: '0'
                                }}
                            >
                                <div style={{ background: 'linear-gradient(135deg, #0288d1 0%, #29b6f6 100%)', borderRadius: '50%', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', boxShadow: '0 8px 16px rgba(2, 136, 209, 0.3)' }}>
                                    <FaUserNurse style={{ fontSize: '2rem', color: 'white' }} />
                                </div>
                                <h2 style={{ color: '#0277bd', margin: '0 0 5px' }}>Soy Cuidador</h2>
                                <p style={{ color: '#546e7a', margin: 0 }}>Gestiono pacientes y el robot</p>
                            </div>

                            {/* Card PACIENTE */}
                            <div
                                className="role-card glass-card shadow-hover"
                                onClick={() => handleSelect("PACIENTE")}
                                style={{
                                    padding: '25px',
                                    background: 'rgba(255, 255, 255, 0.85)',
                                    border: '1px solid rgba(255, 87, 34, 0.1)'
                                }}
                            >
                                <div style={{ background: 'linear-gradient(135deg, #e65100 0%, #ff7043 100%)', borderRadius: '50%', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', boxShadow: '0 8px 16px rgba(230, 81, 0, 0.3)' }}>
                                    <FaUser style={{ fontSize: '1.8rem', color: 'white' }} />
                                </div>
                                <h2 style={{ color: '#e65100', margin: '0 0 5px' }}>Soy Paciente</h2>
                                <p style={{ color: '#546e7a', margin: 0 }}>Recibo mis recordatorios</p>
                            </div>
                        </div>

                        <p style={{ marginTop: '50px', color: '#90a4ae', fontSize: '0.8rem', letterSpacing: '1px' }}>
                            © 2026 PASTIBOT TECHNOLOGY
                        </p>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default Welcome;
