import React, { useState, useEffect } from "react";
import { IonContent, IonSpinner, IonSegment, IonSegmentButton, IonPage } from "@ionic/react";
import { api } from "../../api/axios";
import "./PatientPage.css";

interface HistoryItem {
  id: number;
  status: string;
  dispensedAt: string;
  medicine: { name: string };
}

const PatientHistory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [days, setDays] = useState<string>("7");

  useEffect(() => {
    loadHistory();
  }, [days]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/my/history?days=${days}`);
      setHistory(res.data);
    } catch (err) {
      console.error("Error cargando historial:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group by date
  const groupedHistory = history.reduce((acc, item) => {
    const date = new Date(item.dispensedAt).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, HistoryItem[]>);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "TAKEN": return "✅";
      case "DISPENSED": return "💊";
      case "MISSED": return "⚠️";
      default: return "❓";
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="patient-page">
        <div className="patient-bubble b1"></div>
        <div className="patient-bubble b2"></div>

        <div className="patient-container">
          <h1 className="patient-title">Historial</h1>
          <p className="patient-subtitle">Registro de tus medicaciones</p>

          <IonSegment
            value={days}
            onIonChange={e => setDays(e.detail.value as string)}
            style={{ marginBottom: "1rem" }}
          >
            <IonSegmentButton value="1">Hoy</IonSegmentButton>
            <IonSegmentButton value="7">7 días</IonSegmentButton>
            <IonSegmentButton value="30">30 días</IonSegmentButton>
          </IonSegment>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <IonSpinner name="crescent" />
            </div>
          ) : Object.keys(groupedHistory).length === 0 ? (
            <div className="patient-card">
              <p>No hay historial para este período.</p>
            </div>
          ) : (
            Object.entries(groupedHistory).map(([date, items]) => (
              <div className="patient-card" key={date}>
                <h3 style={{ textTransform: "capitalize" }}>{date}</h3>
                {items.map(item => (
                  <p key={item.id}>
                    {getStatusIcon(item.status)} {item.medicine.name} — {new Date(item.dispensedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                ))}
              </div>
            ))
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PatientHistory;
