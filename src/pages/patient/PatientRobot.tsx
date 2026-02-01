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

      setRobotStatus(statusRes.data);
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
        <div className="patient-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h1 className="patient-title" style={{ textAlign: 'left' }}>Mi Robot</h1>
              <p className="patient-subtitle" style={{ textAlign: 'left' }}>Estado del dispensador</p>
            </div>
            <button
              className="refresh-btn-pro"
              onClick={handleRefresh}
              disabled={refreshing}
              style={{ background: '#fff', border: '1px solid #eee', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IonIcon icon={refreshOutline} className={refreshing ? 'rotating' : ''} style={{ fontSize: '1.2rem', color: 'var(--primary)' }} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                <IonIcon icon={batteryFull} /> Batería
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{robotStatus?.batteryPct || 0}%</div>
            </div>

            <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                <IonIcon icon={wifi} /> Señal
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{robotStatus?.signalStrength || 0} dBm</div>
            </div>
          </div>

          <div className="patient-card" style={{ background: '#fff', padding: '25px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(2, 136, 209, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IonIcon icon={thermometer} style={{ fontSize: '1.2rem' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Temperatura</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{robotStatus?.temperature || 0}°C</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(2, 136, 209, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IonIcon icon={sync} style={{ fontSize: '1.2rem' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Tiempo en línea</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{robotStatus?.uptime || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="upcoming-section" style={{ marginTop: '30px' }}>
            <h3 className="section-title">Dispensación Manual</h3>
            {medicines.length > 0 ? medicines.map(med => (
              <div
                key={med.id}
                className="upcoming-card"
                onClick={() => !dispensing && handleDispense(med.id)}
                style={{ background: '#fff', padding: '15px', borderRadius: '18px', marginBottom: '10px', display: 'flex', alignItems: 'center', opacity: dispensing ? 0.6 : 1 }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}>
                  <IonIcon icon={checkmarkCircle} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{med.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{med.dosage}</div>
                </div>
                <button className="patient-btn small" disabled={dispensing} style={{ margin: 0, width: 'auto' }}>
                  {dispensing ? <IonSpinner name="dots" /> : 'DISPENSAR'}
                </button>
              </div>
            )) : <p>Cargando medicinas...</p>}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PatientRobot;
