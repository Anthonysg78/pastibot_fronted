import React, { useState, useEffect } from "react";
import { IonContent, IonSpinner, IonIcon, IonPage } from "@ionic/react";
import {
  locationOutline,
  medkit,
  time,
  flame,
  warningOutline,
  happy,
  sad,
  fitness,
  flask,
  water,
  bandage,
  thermometer,
  nutrition,
  bed,
  walk,
  heart,
  pulse
} from "ionicons/icons";
import { useHistory } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/axios";
import "./PatientPage.css";

interface Reminder {
  id: number;
  time: string;
  medicineName: string;
  medicineDosage: string;
  medicineId: number;
  medicineIcon?: string;
  medicineInstructions?: string;
  medicineImageUrl?: string;
}

// Map string icon names to IonIcons
const G_ICONS: any = {
  medkit,
  flask,
  water,
  bandage,
  thermometer,
  nutrition,
  bed,
  walk,
  heart,
  pulse,
  time
};

interface HistoryItem {
  id: number;
  status: string;
  dispensedAt: string;
  medicine: { name: string };
}

const PatientHome: React.FC = () => {
  const history = useHistory();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [todayHistory, setTodayHistory] = useState<HistoryItem[]>([]);
  const [dispensing, setDispensing] = useState(false);
  const [lastDispensationId, setLastDispensationId] = useState<number | null>(null);
  const [showMood, setShowMood] = useState(false);

  useEffect(() => {
    console.log("[PatientHome] Auth State:", { authLoading, user: user?.email, role: user?.role, linked: !!user?.patientProfile });

    // 🛡️ SEGURIDAD: Si un cuidador entra aquí por error, mandarlo a su sitio
    if (!authLoading && user && user.role === 'CUIDADOR') {
      window.location.href = "/care/home";
      return;
    }

    if (!authLoading && user?.patientProfile) {
      loadData();
    } else if (!authLoading) {
      setLoading(false); // No hay perfil, dejamos de cargar para mostrar vinculación
    }
  }, [user, authLoading]);

  const loadData = async () => {
    console.log("[PatientHome] Loading data for linked patient...");
    try {
      const [remindersRes, historyRes] = await Promise.all([
        api.get("/my/reminders"),
        api.get("/my/history?days=1"),
      ]);
      setReminders(remindersRes.data);
      setTodayHistory(historyRes.data);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async (medicineId: number) => {
    setDispensing(true);
    try {
      const res = await api.post("/my/dispense", { medicineId });
      await loadData(); // Reload
      if (res.data?.logId) {
        setLastDispensationId(res.data.logId);
        setShowMood(true); // 👈 Mostrar pregunta de estado de ánimo
      }
    } catch (err) {
      console.error("Error dispensando:", err);
      alert("Error al dispensar medicamento. ¿El robot está conectado?");
    } finally {
      setDispensing(false);
    }
  };

  const submitMood = async (mood: string) => {
    if (!lastDispensationId) return;
    try {
      await api.post("/my/mood", { dispensationId: lastDispensationId, mood });
      alert("¡Gracias por decirnos! Le avisaremos a tu cuidador.");
    } catch (err) {
      console.error("Error guardando estado de ánimo:", err);
    } finally {
      setShowMood(false);
      setLastDispensationId(null);
    }
  };

  const nextReminder = reminders[0];
  const completedToday = todayHistory.filter((h: HistoryItem) => h.status === "TAKEN" || h.status === "DISPENSED").length;
  const totalToday = reminders.length + completedToday;

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Buenos días";
    if (hours < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const [linkCode, setLinkCode] = useState("");
  const [linking, setLinking] = useState(false);

  const handleLink = async () => {
    if (!linkCode.trim()) return;
    console.log("[PatientHome] Attempting to link with code:", linkCode);
    setLinking(true);
    try {
      const res = await api.post("/patients/link", { code: linkCode });
      console.log("[PatientHome] Linking success:", res.data);
      alert("¡Cuenta vinculada con éxito! Ahora puedes ver tus medicinas.");
      window.location.reload();
    } catch (err: any) {
      console.error("[PatientHome] Linking error:", err);
      alert(err.response?.data?.message || "Error al vincular. Verifica el código.");
    } finally {
      setLinking(false);
    }
  };

  if (authLoading || loading) {
    return (
      <IonPage>
        <IonContent fullscreen className="patient-page">
          <div className="patient-container center-flex" style={{ height: '100vh' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // 🛡️ REFUERZO DE SEGURIDAD: Si no hay usuario, fuera.
  if (!user) {
    window.location.href = "/welcome";
    return null;
  }

  // 🚨 SI NO TIENE PERFIL DE PACIENTE VINCULADO... MOSTRAR PANTALLA DE VINCULACIÓN
  if (user.role === 'PACIENTE' && !user.patientProfile) {
    console.log("[PatientHome] Rendering linking screen...");
    return (
      <IonPage>
        <IonContent fullscreen className="patient-page">
          <div className="patient-bubble b1"></div>
          <div className="patient-bubble b2"></div>
          <div className="patient-container center-flex" style={{ padding: '30px', textAlign: 'center', minHeight: '80vh' }}>
            <div className="next-dose-card fade-in" style={{ padding: '40px 25px', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(2, 136, 209, 0.1)' }}>
              <div style={{ fontSize: '4.5rem', marginBottom: '15px' }}>🚀</div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 10px 0', color: 'var(--primary)', letterSpacing: '-1px' }}>
                ¡Bienvenido!
              </h2>

              <p style={{ opacity: 0.7, fontSize: '1rem', marginBottom: '35px', lineHeight: '1.5' }}>
                Para comenzar tu aventura con Pastibot, ingresa el <b>Código de Vinculación</b> que te dio tu cuidador.
              </p>

              <div style={{ position: 'relative', marginBottom: '25px' }}>
                <input
                  type="text"
                  placeholder="CÓDIGO AQUÍ"
                  value={linkCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    if (val.length <= 15) setLinkCode(val);
                  }}
                  style={{
                    width: '100%',
                    padding: '20px',
                    borderRadius: '24px',
                    border: '3px solid rgba(2, 136, 209, 0.1)',
                    fontSize: '1.8rem',
                    textAlign: 'center',
                    fontWeight: 900,
                    background: '#f8fbff',
                    color: 'var(--primary)',
                    letterSpacing: '4px',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s'
                  }}
                />
              </div>

              <button
                className={`dispense - btn ${linking ? "loading" : ""} `}
                onClick={handleLink}
                disabled={linking || linkCode.length < 1}
                style={{
                  width: '100%',
                  margin: 0,
                  background: linkCode.length >= 1 ? 'var(--primary-gradient)' : '#cbd5e0',
                  boxShadow: linkCode.length >= 1 ? '0 10px 25px rgba(2, 136, 209, 0.3)' : 'none'
                }}
              >
                {linking ? "Vinculando..." : "CONECTAR AHORA"}
              </button>

              <p style={{ marginTop: '25px', fontSize: '0.8rem', color: '#94a3b8' }}>
                ¿No tienes un código? Pídeselo a tu cuidador en la sección de pacientes.
              </p>
            </div>
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

        <div className="patient-container fade-in">
          <header className="patient-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '15px'
          }}>
            <div style={{ flex: 1, minWidth: 0 }}> {/* minWidth 0 allows text to truncate/wrap properly */}
              <h1 className="patient-title" style={{ margin: 0, textAlign: 'left', fontSize: '1.8rem', lineHeight: '1.2' }}>
                {getGreeting()}, <br />
                <span style={{ color: 'var(--primary)' }}>{user?.name?.split(" ")[0]}</span> 👋
              </h1>
              <p className="patient-subtitle" style={{ margin: '5px 0 0 0', textAlign: 'left', fontSize: '0.95rem' }}>
                Hoy llevas <b>{completedToday}</b> de <b>{totalToday}</b> tomas
              </p>
            </div>

            <div
              onClick={() => history.push("/patient/profile")}
              style={{
                width: '55px',
                height: '55px',
                borderRadius: '18px',
                overflow: 'hidden',
                border: '3px solid white',
                boxShadow: '0 8px 20px rgba(2, 136, 209, 0.15)',
                cursor: 'pointer',
                flexShrink: 0,
                background: '#fff'
              }}
            >
              <img
                src={user?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt="Perfil"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div >
          </header >

          {/* Stats Cards - Horizontal Scroll Container */}
          < div style={{
            display: 'flex',
            gap: '15px',
            marginBottom: '30px',
            overflowX: 'auto',
            paddingBottom: '10px',
            scrollSnapType: 'x mandatory',
            marginRight: '-20px', /* Allow scroll to edge */
            paddingRight: '20px'
          }}>
            <div className="stat-card fade-in-delay-1" style={{ flex: '0 0 100px', scrollSnapAlign: 'start' }}>
              <div className="icon-container" style={{ background: '#e1f5fe', color: '#0288d1' }}>
                <IonIcon icon={medkit} />
              </div>
              <h3>{completedToday}/{totalToday}</h3>
              <p>Completadas</p>
            </div>

            <div className="stat-card fade-in-delay-2" style={{ flex: '0 0 100px', scrollSnapAlign: 'start' }}>
              <div className="icon-container" style={{ background: '#ffebee', color: '#ef5350' }}>
                <IonIcon icon={time} />
              </div>
              <h3>{reminders.length}</h3>
              <p>Pendientes</p>
            </div>

            <div className="stat-card fade-in-delay-3" style={{ flex: '0 0 100px', scrollSnapAlign: 'start' }}>
              <div className="icon-container" style={{ background: '#fff3e0', color: '#ff9800' }}>
                <IonIcon icon={flame} />
              </div>
              <h3>{Math.round((completedToday / (totalToday || 1)) * 100)}%</h3>
              <p>Progreso</p>
            </div>
          </div >

          {/* 🕛 PANEL PRINCIPAL (PRÓXIMA DOSIS) */}
          < div className="next-dose-card" >
            {
              nextReminder ? (
                <>
                  <div className="med-icon-floating" style={{ overflow: 'hidden' }}>
                    {nextReminder.medicineImageUrl ? (
                      <img src={nextReminder.medicineImageUrl} alt={nextReminder.medicineName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <IonIcon icon={G_ICONS[nextReminder.medicineIcon || 'medkit'] || medkit} />
                    )}
                  </div>
                  <h2>Tu próxima pastilla</h2>
                  <div className="dose-time">{nextReminder.time}</div>
                  <div className="dose-info">
                    <span className="pill-name">{nextReminder.medicineName}</span>
                    <span className="pill-dosage">{nextReminder.medicineDosage}</span>
                  </div>

                  {
                    nextReminder.medicineInstructions && (
                      <div className="patient-instructions">
                        <p>"{nextReminder.medicineInstructions}"</p>
                      </div>
                    )
                  }

                  <button
                    className={`dispense-btn ${dispensing ? "loading" : ""}`}
                    onClick={() => handleDispense(nextReminder.medicineId)}
                    disabled={dispensing}
                  >
                    {dispensing ? "Dispensando..." : "TOMAR AHORA"}
                  </button>
                </>
              ) : (
                <div className="all-done">
                  <IonIcon icon={happy} style={{ fontSize: '4rem', color: '#4caf50' }} />
                  <h3>¡Todo listo por hoy!</h3>
                  <p>Has completado todas tus medicinas.</p>
                </div>
              )}
          </div >

          {/* 📋 LISTA DE PRÓXIMAS MEDICINAS */}
          {
            reminders.length > 1 && (
              <div className="upcoming-section">
                <h3 className="section-title">Próximas medicinas</h3>
                {reminders.slice(1, 4).map((reminder: Reminder) => (
                  <div key={reminder.id} className="upcoming-card">
                    <div className="upcoming-time">{reminder.time}</div>
                    <div className="upcoming-info">
                      <div className="upcoming-name">{reminder.medicineName}</div>
                      <div className="upcoming-dosage">{reminder.medicineDosage}</div>
                    </div>
                    <div className="upcoming-icon">
                      <IonIcon icon={G_ICONS[reminder.medicineIcon || 'medkit'] || medkit} />
                    </div>
                  </div>
                ))}
              </div>
            )
          }

          {/* 📜 HISTORIAL DE HOY */}
          {
            todayHistory.length > 0 && (
              <div className="history-section">
                <h3 className="section-title">Historial de hoy</h3>
                {todayHistory.slice(0, 5).map((item: HistoryItem) => (
                  <div key={item.id} className="history-item">
                    <div className={`history-status ${item.status.toLowerCase()}`}>
                      {item.status === 'TAKEN' ? '✓' : item.status === 'DISPENSED' ? '⏳' : '✗'}
                    </div>
                    <div className="history-info">
                      <div className="history-medicine">{item.medicine.name}</div>
                      <div className="history-time">{new Date(item.dispensedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }

          {/* 😍 MODAL/SECCIÓN DE ESTADO DE ÁNIMO (APARECE AL TOMAR) */}
          {
            showMood && (
              <div className="mood-section fade-in">
                <h3>¿Cómo te sientes después de tu medicina?</h3>
                <div className="mood-grid">
                  <button className="mood-btn good" onClick={() => submitMood('GOOD')}>
                    <IonIcon icon={happy} /> Bien
                  </button>
                  <button className="mood-btn normal" onClick={() => submitMood('NORMAL')}>
                    <IonIcon icon={fitness} /> Normal
                  </button>
                  <button className="mood-btn bad" onClick={() => submitMood('BAD')}>
                    <IonIcon icon={sad} /> Mal
                  </button>
                </div>
              </div>
            )
          }

        </div >
      </IonContent >
    </IonPage >
  );
};

export default PatientHome;
