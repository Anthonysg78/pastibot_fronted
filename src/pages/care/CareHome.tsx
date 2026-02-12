import React, { useState, useEffect } from "react";
import { IonContent, IonSpinner, IonPage } from "@ionic/react";
import { useHistory } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/axios";
import "./CarePage.css";

interface Patient {
  id: number;
  name: string;
}

interface RobotStatus {
  status: string;
  wifi: boolean;
  batteryPct: number;
}

const CareHome: React.FC = () => {
  const history = useHistory();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [robotStatus, setRobotStatus] = useState<RobotStatus | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    // 1. Si está cargando auth, esperamos
    if (authLoading) return;

    // 2. Si no hay usuario y no hay token guardado, al login
    if (!user && !localStorage.getItem("token")) {
      history.replace("/login");
      return;
    }

    // 3. Si hay usuario, validar rol y cargar datos
    if (user) {
      if (user.role === 'PACIENTE') {
        history.replace("/patient/home");
        return;
      }

      // Si es cuidador, cargamos los datos del sistema
      if (user.role === 'CUIDADOR') {
        loadData();
      }
    }
  }, [user, authLoading]);

  const loadData = async () => {
    const cachedData = sessionStorage.getItem("care_home_data");
    const now = Date.now();

    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (now - timestamp < 30000) { // ⚡ 30 segundos de gracia
        setPatients(data.patients);
        setRobotStatus(data.robotStatus);
        setRecentLogs(data.recentLogs);
        setLoading(false);
        return; // 🚀 FIX: No pedir en background si la caché es muy fresca (evita spam)
      }
    }

    try {
      const [patientsRes, robotRes, logsRes] = await Promise.all([
        api.get("/patients"),
        api.get("/robot/status"),
        api.get("/robot/logs?limit=5"),
      ]);

      const freshData = {
        patients: patientsRes.data,
        robotStatus: robotRes.data,
        recentLogs: logsRes.data
      };

      setPatients(freshData.patients);
      setRobotStatus(freshData.robotStatus);
      setRecentLogs(freshData.recentLogs);

      sessionStorage.setItem("care_home_data", JSON.stringify({
        data: freshData,
        timestamp: now
      }));
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAlertStatus = () => {
    if (!robotStatus) return { text: "Sin conexión con robot", icon: "⚠️" };
    if (robotStatus.status === "ERROR") return { text: "Robot con problemas", icon: "🔴" };
    if (!robotStatus.wifi) return { text: "Robot sin WiFi", icon: "📶" };
    return { text: "Todo en orden", icon: "✅" };
  };

  const alert = getAlertStatus();

  if (loading) {
    return (
      <IonPage>
        <IonContent fullscreen className="care-page">
          <div className="care-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
            <IonSpinner name="crescent" />
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
        <div className="care-bubble b3" />

        <div className="care-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <h1 className="care-title" style={{ margin: 0 }}>Hola, {user?.name?.split(" ")[0] || "Cuidador"} 👋</h1>
              <p className="care-subtitle" style={{ margin: 0 }}>Resumen del sistema</p>
            </div>
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

          <div className="care-card">
            <h3>Pacientes activos</h3>
            <p>{patients.length} paciente{patients.length !== 1 ? "s" : ""} registrado{patients.length !== 1 ? "s" : ""}</p>
          </div>

          <div className="care-card">
            <h3>Estado del robot</h3>
            {robotStatus ? (
              <>
                <p>📶 WiFi: {robotStatus.wifi ? "Sincronizado" : "Sin conexión"}</p>
                <p>🤖 Estado: <strong>{robotStatus.status}</strong></p>
              </>
            ) : (
              <p>No disponible</p>
            )}
          </div>

          <div className="care-card">
            <h3>Alertas</h3>
            <p>{alert.icon} {alert.text}</p>
          </div>

          {recentLogs.length > 0 && (
            <div className="care-card">
              <h3>Actividad reciente</h3>
              {recentLogs.slice(0, 3).map((log, i) => (
                <p key={i} style={{ fontSize: "0.9rem" }}>
                  {new Date(log.createdAt).toLocaleString("es-ES", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })} — {log.message.substring(0, 40)}...
                </p>
              ))}
            </div>
          )}

          <button
            className="care-btn"
            onClick={() => history.push("/care/control")}
          >
            Control del robot
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CareHome;
