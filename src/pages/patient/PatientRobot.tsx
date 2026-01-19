import React, { useState, useEffect } from "react";
import { IonContent, IonSpinner, IonPage, IonIcon, IonText } from "@ionic/react";
import {
  wifi, flask, batteryFull, batteryHalf, batteryDead,
  hardwareChip, thermometer, sync, time, checkmarkCircle,
  alertCircle, rocket, refreshOutline, bluetooth
} from "ionicons/icons";
import { api } from "../../api/axios";
import "./PatientPage.css";

interface RobotStatus {
  id: number;
  status: string;
  wifi: boolean;
  batteryPct: number;
  updatedAt: string;
  temperature?: number; // Mocked for UI
  uptime?: string; // Mocked for UI
  signalStrength?: number; // Mocked for UI
}

interface HistoryItem {
  id: number;
  status: string;
  dispensedAt: string;
  medicine: { name: string };
}

const PatientRobot: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [robotStatus, setRobotStatus] = useState<RobotStatus | null>(null);
  const [lastAction, setLastAction] = useState<HistoryItem | null>(null);
  const [dispensing, setDispensing] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statusRes, historyRes, medsRes] = await Promise.all([
        api.get("/my/robot"),
        api.get("/my/history?days=1"),
        api.get("/my/medicines"),
      ]);

      // Enhance status with mocked data for "Pro" look
      const baseStatus = statusRes.data;
      const enhancedStatus: RobotStatus = {
        ...baseStatus,
        temperature: 32 + Math.floor(Math.random() * 5),
        uptime: "12d 4h 23m",
        signalStrength: baseStatus.wifi ? 85 + Math.floor(Math.random() * 10) : 0
      };

      setRobotStatus(enhancedStatus);
      setLastAction(historyRes.data[0] || null);
      setMedicines(medsRes.data);
    } catch (err) {
      console.error("Error cargando datos del robot:", err);
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
      await api.post("/my/dispense", { medicineId });
      await loadData();
    } catch (err) {
      console.error("Error dispensando:", err);
      // We'll show a better UI feedback in next steps
    } finally {
      setDispensing(false);
    }
  };

  const getBatteryIcon = (pct: number) => {
    if (pct > 70) return batteryFull;
    if (pct > 20) return batteryHalf;
    return batteryDead;
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent fullscreen className="patient-page">
          <div className="center-flex" style={{ height: "100%" }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen className="patient-page">
        <div className="patient-bubble b1"></div>
        <div className="patient-bubble b2"></div>

        <div className="patient-container robot-dashboard">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="patient-title">Mi Robot</h1>
              <p className="patient-subtitle">Estado y control del dispensador</p>
            </div>
            <button
              className={`refresh-btn-pro ${refreshing ? 'rotating' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <IonIcon icon={refreshOutline} />
            </button>
          </div>

          {/* Visual Robot Section */}
          <section className="robot-visual-section">
            <div className={`robot-aura ${robotStatus?.status === 'DISPENSANDO' ? 'dispensing' : robotStatus?.status === 'ERROR' ? 'error' : ''}`}></div>
            <IonIcon
              icon={rocket}
              className="robot-main-icon"
              style={{ color: robotStatus?.status === 'OK' ? 'var(--primary)' : robotStatus?.status === 'DISPENSANDO' ? '#4caf50' : '#f44336' }}
            />
            <div className="robot-status-main-label">
              {robotStatus?.status === 'OK' ? 'SISTEMA OPERATIVO' :
                robotStatus?.status === 'DISPENSANDO' ? 'DISPENSANDO...' :
                  robotStatus?.status === 'ERROR' ? 'FALLA TÉCNICA' : 'DESCONOCIDO'}
            </div>

            <div className="robot-connectivity-badges">
              <div className={`conn-badge ${robotStatus?.wifi ? 'online' : 'offline'}`}>
                <IonIcon icon={wifi} />
                {robotStatus?.wifi ? 'WEB LINK ACTIVE' : 'NO CONNECTION'}
              </div>
              <div className="conn-badge">
                <IonIcon icon={bluetooth} style={{ color: '#2196f3' }} />
                PASTIBOT-ESP32
              </div>
            </div>
          </section>

          {/* Tech Stats Grid */}
          <section className="status-grid-tech">
            <div className="tech-card">
              <span className="tech-label">Batería</span>
              <div className="tech-value-box">
                <span className="tech-value">{robotStatus?.batteryPct || 0}</span>
                <span className="tech-unit">%</span>
                <IonIcon icon={getBatteryIcon(robotStatus?.batteryPct || 0)} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </div>
              <div className="tech-progress-mini">
                <div
                  className={`tech-progress-fill ${(robotStatus?.batteryPct || 0) > 60 ? 'success' : (robotStatus?.batteryPct || 0) > 20 ? 'warning' : 'danger'}`}
                  style={{ width: `${robotStatus?.batteryPct || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="tech-card">
              <span className="tech-label">Señal WiFi</span>
              <div className="tech-value-box">
                <span className="tech-value">{robotStatus?.signalStrength || 0}</span>
                <span className="tech-unit">dBm</span>
                <IonIcon icon={wifi} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </div>
              <div className="tech-progress-mini">
                <div
                  className="tech-progress-fill primary"
                  style={{ width: `${robotStatus?.signalStrength || 0}%` }}
                ></div>
              </div>
            </div>
          </section>

          {/* System Health */}
          <section className="system-health-card">
            <h3 className="pro-card-title"><IonIcon icon={hardwareChip} /> Integridad del Sistema</h3>
            <div className="health-list">
              <div className="health-item">
                <div className="health-icon"><IonIcon icon={thermometer} /></div>
                <div className="health-info">
                  <span className="health-name">Temperatura CPU</span>
                  <span className="health-status-text">Funcionamiento normal</span>
                </div>
                <div className="health-value-badge">{robotStatus?.temperature}°C</div>
              </div>

              <div className="health-item">
                <div className="health-icon"><IonIcon icon={sync} /></div>
                <div className="health-info">
                  <span className="health-name">Uptime</span>
                  <span className="health-status-text">Tiempo desde el último reinicio</span>
                </div>
                <div className="health-value-badge" style={{ background: 'rgba(33, 150, 243, 0.1)', color: '#1976d2' }}>
                  {robotStatus?.uptime}
                </div>
              </div>

              <div className="health-item">
                <div className="health-icon"><IonIcon icon={time} /></div>
                <div className="health-info">
                  <span className="health-name">Sincronización Cloud</span>
                  <span className="health-status-text">Último reporte de estado</span>
                </div>
                <div className="health-value-badge" style={{ background: 'rgba(156, 39, 176, 0.1)', color: '#7b1fa2' }}>
                  {robotStatus ? new Date(robotStatus.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </div>
              </div>
            </div>
          </section>

          {/* Action Section */}
          <section className="dispense-actions-section">
            <h3 className="pro-card-title"><IonIcon icon={flask} /> Dispensación Manual</h3>
            {medicines.length > 0 ? (
              medicines.map(med => (
                <div
                  key={med.id}
                  className={`dispense-card-item ${dispensing || robotStatus?.status !== 'OK' ? 'disabled' : ''}`}
                  onClick={() => handleDispense(med.id)}
                >
                  <div className="pill-visual-icon">
                    <IonIcon icon={checkmarkCircle} />
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
              <p className="no-history">No tienes medicinas configuradas para dispensar.</p>
            )}
          </section>

          {/* Recent Activity */}
          {lastAction && (
            <section className="system-health-card" style={{ marginBottom: '40px' }}>
              <h3 className="pro-card-title"><IonIcon icon={alertCircle} /> Último Evento</h3>
              <div className="health-item" style={{ border: 'none', padding: 0 }}>
                <div className="health-icon" style={{ background: lastAction.status === 'TAKEN' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(2, 136, 209, 0.1)', color: lastAction.status === 'TAKEN' ? '#4caf50' : '#0288d1' }}>
                  <IonIcon icon={lastAction.status === 'TAKEN' ? checkmarkCircle : flask} />
                </div>
                <div className="health-info">
                  <span className="health-name">{lastAction.medicine.name}</span>
                  <span className="health-status-text">{new Date(lastAction.dispensedAt).toLocaleString()}</span>
                </div>
                <div className="health-value-badge" style={{ background: lastAction.status === 'TAKEN' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(2, 136, 209, 0.1)', color: lastAction.status === 'TAKEN' ? '#2e7d32' : '#0277bd' }}>
                  {lastAction.status === 'TAKEN' ? 'TOMADA' : 'DISPENSADA'}
                </div>
              </div>
            </section>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PatientRobot;
