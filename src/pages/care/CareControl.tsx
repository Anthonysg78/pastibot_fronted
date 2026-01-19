import React, { useState, useEffect } from "react";
import { IonContent, IonSpinner, IonPage, IonIcon, IonSelect, IonSelectOption } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  wifi, flask, batteryFull, batteryHalf, batteryDead,
  hardwareChip, thermometer, sync, time, checkmarkCircle,
  alertCircle, rocket, refreshOutline, bluetooth, person
} from "ionicons/icons";
import { api } from "../../api/axios";
import "./CarePage.css";

interface RobotStatus {
  status: string;
  wifi: boolean;
  batteryPct: number;
  updatedAt: string;
  temperature?: number;
  uptime?: string;
  signalStrength?: number;
}

interface Patient {
  id: number;
  name: string;
  medicines: { id: number; name: string; dosage: string }[];
  user?: {
    photoUrl?: string;
  };
}

const CareControl: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [robotStatus, setRobotStatus] = useState<RobotStatus | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dispensing, setDispensing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statusRes, patientsRes] = await Promise.all([
        api.get("/robot/status").catch(() => ({ data: { status: 'OFFLINE', wifi: false, batteryPct: 0, updatedAt: new Date().toISOString() } })),
        api.get("/patients"),
      ]);

      const baseStatus = statusRes.data;
      const enhancedStatus: RobotStatus = {
        ...baseStatus,
        temperature: baseStatus.temperature || 0,
        uptime: baseStatus.uptime || "N/A",
        signalStrength: baseStatus.signalStrength || 0
      };

      setRobotStatus(enhancedStatus);

      // Load medicines for each patient
      const patientsWithMeds = await Promise.all(
        patientsRes.data.map(async (p: any) => {
          const medsRes = await api.get(`/patients/${p.id}/medicines`);
          return { ...p, medicines: medsRes.data };
        })
      );
      setPatients(patientsWithMeds);

      if (patientsWithMeds.length > 0 && !selectedPatient) {
        setSelectedPatient(patientsWithMeds[0].id);
      }
    } catch (err) {
      console.error("Error cargando control:", err);
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
    setDispensing(true);
    try {
      await api.post("/robot/dispense", { medicineId, amount: 1 });
      await loadData();
    } catch (err) {
      console.error("Error dispensando:", err);
    } finally {
      setDispensing(false);
    }
  };

  const currentPatient = patients.find(p => p.id === selectedPatient);
  const getBatteryIcon = (pct: number) => {
    if (pct > 70) return batteryFull;
    if (pct > 20) return batteryHalf;
    return batteryDead;
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
        <div className="care-bubble b1" />
        <div className="care-bubble b2" />

        <div className="care-container robot-dashboard">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="care-title">Control Robot</h1>
              <p className="care-subtitle">Mando a distancia de Pastibot</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                className={`refresh-btn-pro ${refreshing ? 'rotating' : ''}`}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <IonIcon icon={refreshOutline} />
              </button>
              <div
                onClick={() => history.push("/care/profile")}
                style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '15px',
                  overflow: 'hidden',
                  border: '2px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={user?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Anthony"}
                  alt="Perfil"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>

          {/* Visual Robot Section */}
          <section className="robot-visual-section">
            <div className={`robot-aura ${robotStatus?.status === 'DISPENSANDO' ? 'dispensing' : robotStatus?.status === 'ERROR' ? 'error' : ''}`}></div>
            <IonIcon
              icon={rocket}
              className="robot-main-icon"
              style={{ color: robotStatus?.status === 'OK' ? 'var(--primary)' : robotStatus?.status === 'OFFLINE' ? '#cbd5e0' : '#f44336' }}
            />
            <div className="robot-status-main-label">
              {robotStatus?.status === 'OK' ? 'CONEXIÓN ESTABLE' :
                robotStatus?.status === 'OFFLINE' ? 'ROBOT DESCONECTADO' :
                  robotStatus?.status === 'ERROR' ? 'SISTEMA EN FALLA' : robotStatus?.status}
            </div>

            <div className="robot-connectivity-badges">
              <div className={`conn-badge ${robotStatus?.wifi ? 'online' : ''}`}>
                <IonIcon icon={wifi} />
                {robotStatus?.wifi ? 'SINCRO CLOUD OK' : 'LOCAL ONLY'}
              </div>
              <div className="conn-badge">
                <IonIcon icon={bluetooth} style={{ color: '#2196f3' }} />
                PASTIBOT-ESP32
              </div>
            </div>
          </section>

          {/* Hardware Stats Grid */}
          <section className="status-grid-tech">
            <div className="tech-card">
              <span className="tech-label">Batería</span>
              <div className="tech-value-box">
                <span className="tech-value">{robotStatus?.batteryPct || 0}</span>
                <span className="tech-unit">%</span>
                <IonIcon icon={getBatteryIcon(robotStatus?.batteryPct || 0)} style={{ marginLeft: 'auto', opacity: 0.3 }} />
              </div>
              <div className="tech-progress-mini">
                <div
                  className={`tech-progress-fill ${(robotStatus?.batteryPct || 0) > 60 ? 'success' : 'warning'}`}
                  style={{ width: `${robotStatus?.batteryPct || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="tech-card">
              <span className="tech-label">WiFi Link</span>
              <div className="tech-value-box">
                <span className="tech-value">{robotStatus?.signalStrength || 0}</span>
                <span className="tech-unit">dBm</span>
                <IonIcon icon={wifi} style={{ marginLeft: 'auto', opacity: 0.3 }} />
              </div>
              <div className="tech-progress-mini">
                <div className="tech-progress-fill primary" style={{ width: `${robotStatus?.signalStrength || 0}%` }}></div>
              </div>
            </div>
          </section>

          {/* System Integrity */}
          <section className="system-health-card">
            <h3 className="pro-card-title"><IonIcon icon={hardwareChip} /> Estado del Hardware</h3>
            <div className="health-list">
              <div className="health-item">
                <div className="health-icon"><IonIcon icon={thermometer} /></div>
                <div className="health-info">
                  <span className="health-name">Temperatura Nucleo</span>
                  <span className="health-status-text">Estabilidad térmica</span>
                </div>
                <div className="health-value-badge">{robotStatus?.temperature}°C</div>
              </div>
              <div className="health-item">
                <div className="health-icon"><IonIcon icon={sync} /></div>
                <div className="health-info">
                  <span className="health-name">Uptime Total</span>
                  <span className="health-status-text">Tiempo en línea</span>
                </div>
                <div className="health-value-badge">{robotStatus?.uptime}</div>
              </div>
            </div>
          </section>

          {/* Remote Control Section */}
          <section className="dispense-actions-section">
            <h3 className="pro-card-title"><IonIcon icon={flask} /> Dispensación Remota</h3>

            <div className="patient-confirm-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', padding: '10px', background: '#f8fafc', borderRadius: '18px' }}>
              <div className="mini-avatar" style={{ width: '50px', height: '50px', borderRadius: '15px', overflow: 'hidden', background: '#e2e8f0' }}>
                {currentPatient?.user?.photoUrl ? (
                  <img src={currentPatient.user.photoUrl} alt={currentPatient.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#a0aec0' }}>
                    {currentPatient?.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="patient-select-wrapper-pro" style={{ flex: 1, margin: 0 }}>
                <IonIcon icon={person} />
                <IonSelect
                  value={selectedPatient}
                  onIonChange={e => setSelectedPatient(e.detail.value)}
                  placeholder="Seleccionar Paciente"
                  className="pro-select-ion"
                >
                  {patients.map(p => (
                    <IonSelectOption key={p.id} value={p.id}>{p.name}</IonSelectOption>
                  ))}
                </IonSelect>
              </div>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentPatient?.medicines && currentPatient.medicines.length > 0 ? (
                currentPatient.medicines.map(med => (
                  <div key={med.id} className="dispense-card-item" onClick={() => handleDispense(med.id)}>
                    <div className="pill-visual-icon">
                      <IonIcon icon={flask} />
                    </div>
                    <div className="pill-info-mini">
                      <span className="pill-name-mini">{med.name}</span>
                      <span className="pill-dosage-mini">{med.dosage}</span>
                    </div>
                    <button className="btn-dispense-mini" disabled={dispensing || robotStatus?.status !== 'OK'}>
                      {dispensing ? <IonSpinner name="dots" /> : 'DISPENSAR'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state-pro">
                  <p>No hay medicinas para este paciente</p>
                </div>
              )}
            </div>
          </section>

          {/* Last Update Info */}
          <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.75rem', marginBottom: '30px' }}>
            Último reporte: {new Date(robotStatus?.updatedAt || '').toLocaleString()}
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default CareControl;
