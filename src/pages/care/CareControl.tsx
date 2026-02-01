import React, { useState, useEffect } from "react";
import { IonContent, IonSpinner, IonPage, IonIcon, IonSelect, IonSelectOption, IonModal, IonButton, IonInput, IonLabel, IonItem } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  wifi, flask, batteryFull, batteryHalf, batteryDead,
  hardwareChip, thermometer, sync, time, checkmarkCircle,
  alertCircle, rocket, refreshOutline, bluetooth, person, closeOutline
} from "ionicons/icons";
import { api } from "../../api/axios";
import { io } from "socket.io-client";
import StatusModal from "../../components/StatusModal";
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
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [newMedicineName, setNewMedicineName] = useState("");

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

  // Conexión WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3000");

    socket.on("connect", () => {
      console.log("🔌 WebSocket conectado al servidor de Pastibot");
    });

    socket.on("robotStatusUpdate", (data) => {
      console.log("🤖 Cambio detectado en el robot:", data);

      // Solo actualizamos si los datos corresponden al robot actual
      // (Podríamos filtrar por serialNumber si tuviéramos múltiples robots en la misma vista)
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
      console.log("💊 Actualización de tarea de dispensado:", data);
      // Aquí podrías disparar una notificación o recargar la lista de tareas si fuera necesario
      if (data.status === 'PENDING') {
        setDispensing(true);
      } else if (data.status === 'COMPLETED') {
        setDispensing(false);
        // Recargar inventario para ver cambios en stock si aplica
        api.get("/robot/inventory").then(res => setInventory(res.data));
      }
    });

    return () => {
      socket.disconnect();
    };
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

      // Load inventory
      const inventoryRes = await api.get("/robot/inventory");
      setInventory(inventoryRes.data);
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
    if (robotStatus?.status !== 'OK') {
      showStatus('warning', 'Robot Offline', `El robot está ${robotStatus?.status || 'desconectado'}. Asegúrate de que esté encendido.`);
      return;
    }

    setDispensing(true);
    try {
      const res = await api.post("/robot/dispense", { medicineId, amount: 1 });
      if (res.data.ok) {
        showStatus('success', 'Orden Enviada', 'El robot ha recibido la orden de dispensado.');
      }
      await loadData();
    } catch (err: any) {
      console.error("Error dispensando:", err);
      const msg = err.response?.data?.message || 'No se pudo enviar la orden al robot.';
      showStatus('error', 'Error de Dispensado', msg);
    } finally {
      setDispensing(false);
    }
  };

  const handleSlotClick = (slotNum: number) => {
    setSelectedSlot(slotNum);
    const slotData = inventory.find(inv => inv.slot === slotNum);
    setNewMedicineName(slotData?.medicineName || "");
    setInventoryModalOpen(true);
  };

  const handleSaveInventory = async () => {
    if (!selectedSlot || !newMedicineName.trim()) return;
    try {
      await api.post("/robot/inventory?serialNumber=esp32pastibot", {
        slot: selectedSlot,
        medicineName: newMedicineName.trim()
      });
      await loadData();
      setInventoryModalOpen(false);
      setNewMedicineName("");
      setSelectedSlot(null);
    } catch (err) {
      console.error("Error actualizando inventario:", err);
    }
  };

  const handleManualDispense = async (slotNumber: number) => {
    if (robotStatus?.status !== 'OK') {
      showStatus('warning', 'Robot Offline', 'No puedes dispensar manualmente si el robot no está en línea.');
      return;
    }

    setDispensing(true);
    try {
      const res = await api.post("/robot/dispense-slot?serialNumber=esp32pastibot", { slot: slotNumber, amount: 1 });
      if (res.data.ok) {
        showStatus('success', 'Carril Activado', `Activando carril ${slotNumber} del robot.`);
      }
      await loadData();
    } catch (err: any) {
      console.error("Error dispensando carril:", err);
      showStatus('error', 'Error Manual', 'No se pudo activar el carril manualmente.');
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
                className={`refresh-btn-pro ${(refreshing || loading) ? 'rotating' : ''}`}
                onClick={handleRefresh}
                disabled={refreshing || loading}
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
          <section className={`robot-visual-section status-${robotStatus?.status?.toLowerCase() || 'offline'}`}>
            <div className={`robot-aura ${robotStatus?.status === 'DISPENSANDO' ? 'dispensing' : robotStatus?.status === 'ERROR' ? 'error' : ''}`}></div>

            {/* 🤖 CARITA DE ROBOT DINÁMICA */}
            <div className="robot-face-container">
              <div className="robot-eyes">
                <div className="eye"></div>
                <div className="eye"></div>
              </div>
              <div className="robot-mouth"></div>
            </div>

            <div className="robot-status-main-label">
              {robotStatus?.status === 'OK' ? 'CONEXIÓN ESTABLE' :
                robotStatus?.status === 'OFFLINE' ? 'ROBOT DESCONECTADO' :
                  robotStatus?.status === 'ERROR' ? 'SISTEMA EN FALLA' :
                    robotStatus?.status === 'DISPENSANDO' ? 'DISPENSANDO...' : robotStatus?.status}
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


          {/* System Integrity */}
          <section className={`system-health-card ${robotStatus?.status === 'OFFLINE' ? 'offline' : ''}`}>
            <h3 className="pro-card-title"><IonIcon icon={hardwareChip} /> Estado del Hardware</h3>
            <div className="health-list">
              <div className="health-item">
                <div className="health-icon"><IonIcon icon={thermometer} /></div>
                <div className="health-info">
                  <span className="health-name">Temperatura Nucleo</span>
                  <span className="health-status-text">Estabilidad térmica</span>
                </div>
                <div className="health-value-badge">
                  {robotStatus?.status === 'OFFLINE' ? '---' : `${robotStatus?.temperature}°C`}
                </div>
              </div>
              <div className="health-item">
                <div className="health-icon"><IonIcon icon={sync} /></div>
                <div className="health-info">
                  <span className="health-name">Uptime Total</span>
                  <span className="health-status-text">Tiempo en línea</span>
                </div>
                <div className="health-value-badge">
                  {robotStatus?.status === 'OFFLINE' ? '---' : robotStatus?.uptime}
                </div>
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

          {/* Slot Inventory Management */}
          <section className="slot-inventory-section" style={{ marginTop: '20px' }}>
            <h3 className="pro-card-title"><IonIcon icon={hardwareChip} /> Inventario de Carriles</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Gestiona qué medicina está cargada en cada carril del robot</p>

            <div className="slots-inventory-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '15px' }}>
              {[1, 2, 3, 4].map(slotNum => {
                const medicineInSlot = inventory.find(inv => inv.slot === slotNum);
                return (
                  <div
                    key={slotNum}
                    onClick={() => handleSlotClick(slotNum)}
                    className="slot-inventory-card"
                    style={{
                      padding: '15px',
                      borderRadius: '18px',
                      background: medicineInSlot ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8fafc',
                      border: medicineInSlot ? 'none' : '2px dashed #cbd5e0',
                      color: medicineInSlot ? 'white' : '#64748b',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      minHeight: '100px',
                      transition: 'all 0.3s',
                      boxShadow: medicineInSlot ? '0 8px 20px rgba(102, 126, 234, 0.3)' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 700 }}>MOTOR {slotNum}</div>
                      {medicineInSlot && (
                        <IonIcon icon={flask} style={{ fontSize: '1.2rem', opacity: 0.8 }} />
                      )}
                    </div>

                    {medicineInSlot ? (
                      <>
                        <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '5px' }}>{medicineInSlot.medicineName}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Toca para editar</div>
                        <button
                          className="btn-dispense-mini"
                          style={{ marginTop: '10px', background: 'rgba(255,255,255,0.2)', border: '1px solid white' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualDispense(slotNum);
                          }}
                          disabled={dispensing || robotStatus?.status !== 'OK'}
                        >
                          PROBAR
                        </button>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: '10px', opacity: 0.6 }}>
                        Toca para asignar
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '15px', padding: '12px', background: '#fef3c7', borderRadius: '12px', fontSize: '0.8rem', color: '#92400e' }}>
              💡 <strong>Consejo:</strong> Define qué medicina está en cada carril para que solo aparezcan al programar pacientes.
            </div>
          </section>

          {/* Inventory Assignment Modal */}
          <IonModal
            isOpen={inventoryModalOpen}
            onDidDismiss={() => setInventoryModalOpen(false)}
            className="inventory-modal"
            style={{
              '--height': 'auto',
              '--width': '90%',
              '--max-width': '400px',
              '--border-radius': '20px',
              '--background': 'white'
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '12px 18px',
              color: 'white',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 900
              }}>
                {selectedSlot}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 700 }}>MOTOR {selectedSlot}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800 }}>Asignar Medicina</div>
              </div>
              <IonIcon
                icon={closeOutline}
                style={{ fontSize: '1.4rem', cursor: 'pointer', opacity: 0.8 }}
                onClick={() => setInventoryModalOpen(false)}
              />
            </div>

            <div style={{ padding: '18px', background: 'white' }}>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  value={newMedicineName}
                  onChange={e => setNewMedicineName(e.target.value)}
                  placeholder="Nombre de la medicina..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '2px solid #e2e8f0',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s',
                    fontFamily: 'inherit',
                    background: 'white',
                    color: '#1a202c'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setInventoryModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    background: 'white',
                    color: '#64748b',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveInventory}
                  disabled={!newMedicineName.trim()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: newMedicineName.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#cbd5e0',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: newMedicineName.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: newMedicineName.trim() ? '0 4px 10px rgba(102, 126, 234, 0.3)' : 'none'
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </IonModal>

          {/* Last Update Info */}
          <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.75rem', marginBottom: '30px', marginTop: '20px' }}>
            Último reporte: {new Date(robotStatus?.updatedAt || '').toLocaleString()}
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

export default CareControl;
