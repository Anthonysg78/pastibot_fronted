import React, { useState, useEffect } from "react";
import { IonContent, IonSpinner, IonPage, IonIcon, IonModal, IonButton } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  wifi, flask, batteryFull, batteryHalf, batteryDead,
  hardwareChip, thermometer, sync, time, checkmarkCircle,
  alertCircle, rocket, refreshOutline, bluetooth, closeOutline
} from "ionicons/icons";
import { api } from "../../api/axios";
import { io } from "socket.io-client";
import StatusModal from "../../components/StatusModal";
import "./PatientPage.css";
// Usamos los mismos estilos que CarePage para consistencia
import "../care/CarePage.css";

interface RobotStatus {
  status: string;
  wifi: boolean;
  batteryPct: number;
  updatedAt: string;
  temperature?: number;
  uptime?: string;
  signalStrength?: number;
}

const PatientRobot: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [robotStatus, setRobotStatus] = useState<RobotStatus | null>(null);
  const [dispensing, setDispensing] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);

  // Status Modal State
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusConfig, setStatusConfig] = useState<{ type: 'success' | 'error' | 'warning' | 'info', title: string, message: string }>({
    type: 'info',
    title: '',
    message: ''
  });

  const showStatus = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setStatusConfig({ type, title, message });
    setStatusOpen(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Conexión WebSocket para actualizaciones en tiempo real (Igual que CareControl)
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3000");

    socket.on("connect", () => {
      console.log("🔌 Patient WebSocket conectado al servidor");
    });

    socket.on("robotStatusUpdate", (data) => {
      console.log("🤖 Cambio detectado en el robot (Vista Paciente):", data);
      setRobotStatus({
        status: data.status,
        wifi: data.wifi,
        batteryPct: data.batteryPct,
        updatedAt: data.updatedAt,
        temperature: data.temperature || 0,
        uptime: data.uptime || "N/A",
        signalStrength: data.signalStrength || 0
      });
    });

    socket.on("robotTaskUpdate", (data) => {
      if (data.status === 'PENDING') {
        setDispensing(true);
      } else if (data.status === 'COMPLETED') {
        setDispensing(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadData = async () => {
    try {
      const [statusRes, medsRes] = await Promise.all([
        // Usamos el endpoint del paciente que devuelve SU robot
        api.get("/my/robot").catch(() => ({
          data: { status: 'OFFLINE', wifi: false, batteryPct: 0, updatedAt: new Date().toISOString() }
        })),
        api.get("/my/medicines"),
      ]);

      const baseStatus = statusRes.data;
      setRobotStatus({
        ...baseStatus,
        temperature: baseStatus.temperature || 0,
        uptime: baseStatus.uptime || "N/A",
        signalStrength: baseStatus.signalStrength || 0
      });

      setMedicines(medsRes.data);
    } catch (err) {
      console.error("Error cargando control del paciente:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDispense = async (medicineId: number) => {
    if (robotStatus?.status !== 'OK') {
      showStatus('warning', 'Robot Offline', 'El robot no está conectado. No se puede dispensar ahora.');
      return;
    }

    setDispensing(true);
    try {
      // Endpoint del paciente para dispensar SU medicina
      const res = await api.post("/my/dispense", { medicineId });
      if (res.data.ok) {
        showStatus('success', 'Orden Enviada', 'He avisado al robot. ¡Ya sale tu medicina!');
      }
      await loadData();
    } catch (err: any) {
      console.error("Error dispensando:", err);
      const msg = err.response?.data?.message || 'No se pudo activar el robot.';
      showStatus('error', 'Error', msg);
    } finally {
      setDispensing(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent fullscreen className="care-page">
          <div className="center-flex" style={{ height: "100%" }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen className="care-page">
        {/* Burbujas de fondo (mismo estilo que Cuidador) */}
        <div className="care-bubble b1" style={{ background: 'rgba(2, 136, 209, 0.15)' }} />
        <div className="care-bubble b2" style={{ background: 'rgba(2, 136, 209, 0.1)' }} />

        <div className="care-container robot-dashboard">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="care-title">Mi Robot</h1>
              <p className="care-subtitle">Estado de tu dispensador</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                className={`refresh-btn-pro ${(refreshing || loading) ? 'rotating' : ''}`}
                onClick={handleRefresh}
                disabled={refreshing || loading}
              >
                <IonIcon icon={refreshOutline} />
              </button>
              <div
                style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '15px',
                  overflow: 'hidden',
                  border: '2px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <img
                  src={user?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Patient'}`}
                  alt="Perfil"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>

          {/* Seccion Visual Robot (LA CARITA!) */}
          <section className={`robot-visual-section status-${robotStatus?.status?.toLowerCase() || 'offline'}`}>
            <div className={`robot-aura ${robotStatus?.status === 'DISPENSANDO' ? 'dispensing' : robotStatus?.status === 'ERROR' ? 'error' : ''}`}></div>

            <div className="robot-face-container">
              <div className="robot-eyes">
                <div className="eye"></div>
                <div className="eye"></div>
              </div>
              <div className="robot-mouth"></div>
            </div>

            <div className="robot-status-main-label">
              {robotStatus?.status === 'OK' ? 'SISTEMA LISTO' :
                robotStatus?.status === 'OFFLINE' ? 'ROBOT APAGADO' :
                  robotStatus?.status === 'ERROR' ? 'NECESITA ATENCIÓN' :
                    robotStatus?.status === 'DISPENSANDO' ? 'ENTREGANDO MEDICINA...' : robotStatus?.status}
            </div>

            <div className="robot-connectivity-badges">
              <div className={`conn-badge ${robotStatus?.wifi ? 'online' : ''}`}>
                <IonIcon icon={wifi} />
                {robotStatus?.wifi ? 'CLAVE: CONECTADO' : 'SIN RED'}
              </div>
              <div className="conn-badge">
                <IonIcon icon={bluetooth} style={{ color: '#2196f3' }} />
                PASTIBOT-ESP32
              </div>
            </div>
          </section>

          {/* Estadísticas de Batería y Señal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div className="system-health-card" style={{ padding: '15px' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase' }}>
                <IonIcon icon={batteryFull} /> Batería
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '5px' }}>
                {robotStatus?.batteryPct || 0}%
              </div>
            </div>
            <div className="system-health-card" style={{ padding: '15px' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase' }}>
                <IonIcon icon={wifi} /> Señal
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '5px' }}>
                {robotStatus?.signalStrength || 0} dBm
              </div>
            </div>
          </div>

          {/* Salud del Sistema */}
          <section className={`system-health-card ${robotStatus?.status === 'OFFLINE' ? 'offline' : ''}`}>
            <h3 className="pro-card-title"><IonIcon icon={hardwareChip} /> Integridad del Robot</h3>
            <div className="health-list">
              <div className="health-item">
                <div className="health-icon"><IonIcon icon={thermometer} /></div>
                <div className="health-info">
                  <span className="health-name">Temperatura</span>
                  <span className="health-status-text">Sensor interno</span>
                </div>
                <div className="health-value-badge">
                  {robotStatus?.status === 'OFFLINE' ? '---' : `${robotStatus?.temperature}°C`}
                </div>
              </div>
              <div className="health-item">
                <div className="health-icon"><IonIcon icon={sync} /></div>
                <div className="health-info">
                  <span className="health-name">Uptime</span>
                  <span className="health-status-text">Activo hace</span>
                </div>
                <div className="health-value-badge">
                  {robotStatus?.status === 'OFFLINE' ? '---' : robotStatus?.uptime}
                </div>
              </div>
            </div>
          </section>

          {/* Acciones de Dispensación (SÓLO SUS MEDICINAS) */}
          <section className="dispense-actions-section" style={{ marginTop: '20px' }}>
            <h3 className="pro-card-title"><IonIcon icon={flask} /> Dispensación Manual</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Usa estos botones solo si necesitas tu medicina ahora mismo.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {medicines.length > 0 ? (
                medicines.map(med => (
                  <div key={med.id} className="dispense-card-item" onClick={() => handleDispense(med.id)}>
                    <div className="pill-visual-icon" style={{ background: 'rgba(2,136,209,0.1)', color: 'var(--primary)' }}>
                      <IonIcon icon={flask} />
                    </div>
                    <div className="pill-info-mini">
                      <span className="pill-name-mini">{med.name}</span>
                      <span className="pill-dosage-mini">{med.dosage}</span>
                    </div>
                    <button className="btn-dispense-mini" disabled={dispensing || robotStatus?.status !== 'OK'}>
                      {dispensing ? <IonSpinner name="dots" /> : 'TOMAR'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state-pro">
                  <p>No tienes medicinas programadas aún.</p>
                </div>
              )}
            </div>
          </section>

          {/* Pie de página */}
          <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.75rem', marginBottom: '30px', marginTop: '30px' }}>
            Estado actualizado: {new Date(robotStatus?.updatedAt || '').toLocaleTimeString()}
          </div>
        </div>

        <StatusModal
          isOpen={statusOpen}
          type={statusConfig.type}
          title={statusConfig.title}
          message={statusConfig.message}
          onClose={() => setStatusOpen(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default PatientRobot;
