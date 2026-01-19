import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonPage,
  IonIcon,
  useIonViewWillEnter,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonAlert,
  IonFab,
  IonFabButton
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/axios";
import { personCircle, chevronForwardOutline, checkmarkCircle, refreshOutline, pencilOutline, closeOutline, saveOutline, trashOutline, add } from "ionicons/icons";
import "./CarePage.css";

type Patient = {
  id: number;
  name: string;
  age?: number;
  gender?: string;
  condition?: string;
  linkCode?: string;
  userId?: number;
  user?: {
    photoUrl?: string;
  };
};

const CarePatients: React.FC = () => {
  const history = useHistory();
  const { user, getProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit Patient Modal State
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editAge, setEditAge] = useState<string>("");
  const [editGender, setEditGender] = useState<string>("");
  const [editCondition, setEditCondition] = useState<string>("");
  const [editName, setEditName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Fallback useEffect al montar
  useEffect(() => {
    loadPatients();
    getProfile(); // Asegurar datos frescos del cuidador
  }, []);

  // 🚀 REFRESCAR AUTOMÁTICAMENTE AL ENTRAR A LA PESTAÑA
  useIonViewWillEnter(() => {
    loadPatients();
  });

  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get("/patients");
      console.log("📦 Pacientes recibidos del backend:", res.data);
      setPatients(res.data);
    } catch (err) {
      console.error("❌ Error cargando pacientes:", err);
      alert("Error al cargar pacientes. Verifica la consola.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: any) => {
    await loadPatients();
    await getProfile();
    event.detail.complete();
  };

  // 🚀 Ir a medicamentos por paciente REAL
  const openMedicines = (id: number) => {
    history.push(`/care/medicines/${id}`);
  };

  const handleEditClick = (e: React.MouseEvent, p: Patient) => {
    e.stopPropagation();
    setEditingPatient(p);
    setEditName(p.name);
    setEditAge(p.age ? p.age.toString() : "");
    setEditGender(p.gender || "");
    setEditCondition(p.condition || "");
  };

  const handleSavePatient = async () => {
    if (!editingPatient) return;
    setSaving(true);
    try {
      await api.patch(`/patients/${editingPatient.id}`, {
        name: editName,
        age: editAge ? Number(editAge) : null,
        gender: editGender,
        condition: editCondition
      });
      setEditingPatient(null);
      loadPatients(); // Recargar lista
    } catch (err) {
      console.error("Error actualizando paciente:", err);
      alert("No se pudo actualizar el paciente");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      await api.delete(`/patients/${patientToDelete.id}`);
      setPatientToDelete(null);
      loadPatients();
    } catch (err) {
      console.error("Error eliminando paciente:", err);
      alert("No se pudo eliminar el paciente");
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="care-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent pullingText="Desliza para actualizar" refreshingSpinner="crescent" />
        </IonRefresher>

        <div className="care-bubble b1" />
        <div className="care-bubble b2" />

        <div className="care-container">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
            <div>
              <h1 className="care-title">Gestión de Pacientes</h1>
              <p className="care-subtitle">Tus pacientes aparecerán aquí automáticamente.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => loadPatients()}
                style={{ background: 'white', border: 'none', padding: '10px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center' }}
              >
                <IonIcon icon={refreshOutline} style={{ fontSize: '1.4rem', color: loading ? '#ccc' : 'var(--primary)', animation: loading ? 'rotate 1s linear infinite' : 'none' }} />
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
          </header>

          {/* TARJETA DE CÓDIGO MAESTRO */}
          <div className="sharing-code-card" style={{
            background: 'var(--primary-gradient)',
            borderRadius: '28px',
            padding: '25px 20px',
            marginBottom: '40px',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 15px 35px rgba(2, 136, 209, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Mi Código Profesional</p>
            <h2 style={{ fontSize: '3rem', margin: 0, fontWeight: 900, letterSpacing: '10px', textShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>{user?.sharingCode || '------'}</h2>
            <div style={{ margin: '15px auto 10px', height: '1px', background: 'rgba(255,255,255,0.2)', width: '60%' }}></div>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8, lineHeight: '1.4' }}>Dile a tus pacientes que ingresen este código<br />para vincularse a tu cuenta.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--primary)', fontSize: '1.2rem' }}>Pacientes Vinculados</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, background: '#f0f4f8', padding: '6px 12px', borderRadius: '12px' }}>
              {patients.length} / 2 cupos
            </span>
          </div>

          {loading ? (
            <div className="care-card" style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(255,255,255,0.5)', borderRadius: '24px' }}>
              <IonSpinner name="crescent" style={{ width: '50px', height: '50px', color: 'var(--primary)' }} />
              <p style={{ margin: '15px 0 0 0', fontWeight: 700, color: '#64748b', fontSize: '1.1rem' }}>Cargando pacientes...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="care-card" style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(255,255,255,0.5)', border: '2px dashed #cbd5e0', borderRadius: '24px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>⌛</div>
              <p style={{ margin: 0, fontWeight: 700, color: '#64748b', fontSize: '1.1rem' }}>Esperando pacientes...</p>
              <p style={{ fontSize: '0.9rem', marginTop: '8px', color: '#94a3b8', lineHeight: '1.4' }}>Comparte tu código maestro para empezar a gestionar sus medicinas.</p>
            </div>
          ) : (
            <div className="patients-grid" style={{ display: 'grid', gap: '15px' }}>
              {patients.map((p) => (
                <div
                  className="care-card fade-in"
                  key={p.id}
                  onClick={() => openMedicines(p.id)}
                  style={{
                    cursor: "pointer",
                    display: 'flex',
                    alignItems: 'center',
                    padding: '18px',
                    border: '1px solid rgba(2, 136, 209, 0.08)',
                    background: 'white',
                    borderRadius: '24px',
                    transition: 'transform 0.2s'
                  }}
                >
                  <div className="patient-avatar" style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    marginRight: '18px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    background: '#f1f5f9'
                  }}>
                    {p.user?.photoUrl ? (
                      <img src={p.user.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IonIcon icon={personCircle} style={{ fontSize: '2.8rem', color: '#cbd5e0' }} />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1e293b' }}>{p.name}</h3>
                      <IonIcon icon={checkmarkCircle} color="success" style={{ fontSize: '1.1rem' }} />
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                      {p.age ? `${p.age} años • ` : ""}{p.condition || "Sin diagnóstico"}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="care-btn-icon-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPatientToDelete(p);
                      }}
                      style={{ background: '#fee2e2', border: 'none', padding: '8px', borderRadius: '10px', display: 'flex', color: '#ef4444' }}
                    >
                      <IonIcon icon={trashOutline} />
                    </button>
                    <button
                      onClick={(e) => handleEditClick(e, p)}
                      style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '10px', display: 'flex', color: 'var(--primary)' }}
                    >
                      <IonIcon icon={pencilOutline} />
                    </button>
                    <IonIcon icon={chevronForwardOutline} style={{ fontSize: '1.4rem', color: '#cbd5e0' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ALERT DE ELIMINACIÓN */}
        <IonAlert
          isOpen={!!patientToDelete}
          onDidDismiss={() => setPatientToDelete(null)}
          header={'¿Eliminar Paciente?'}
          subHeader={'Esta acción no se puede deshacer'}
          message={`¿Estás seguro que deseas eliminar a <strong>${patientToDelete?.name}</strong>? Se borrarán sus datos y recetas.`}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary',
              handler: () => setPatientToDelete(null)
            },
            {
              text: 'Eliminar',
              handler: confirmDelete,
              cssClass: 'alert-delete-button',
            }
          ]}
          cssClass="custom-alert"
        />

        {/* MODAL DE EDICIÓN DE PACIENTE */}
        <IonModal isOpen={!!editingPatient} onDidDismiss={() => setEditingPatient(null)}>
          <div style={{ padding: '30px', background: 'white', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--primary)' }}>Editar Paciente</h2>
              <button onClick={() => setEditingPatient(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#666' }}>
                <IonIcon icon={closeOutline} />
              </button>
            </div>

            <IonItem className="pro-input-item" style={{ marginBottom: '15px' }}>
              <IonLabel position="stacked">Nombre del Paciente</IonLabel>
              <IonInput value={editName} onIonInput={e => setEditName(String(e.detail.value))} />
            </IonItem>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <IonItem className="pro-input-item" style={{ flex: 1 }}>
                <IonLabel position="stacked">Edad</IonLabel>
                <IonInput type="number" value={editAge} onIonInput={e => setEditAge(String(e.detail.value))} />
              </IonItem>
              <IonItem className="pro-input-item" style={{ flex: 1 }}>
                <IonLabel position="stacked">Género</IonLabel>
                <IonSelect value={editGender} onIonChange={e => setEditGender(e.detail.value)} interface="popover">
                  <IonSelectOption value="Masculino">Masculino</IonSelectOption>
                  <IonSelectOption value="Femenino">Femenino</IonSelectOption>
                  <IonSelectOption value="Otro">Otro</IonSelectOption>
                </IonSelect>
              </IonItem>
            </div>

            <IonItem className="pro-input-item" style={{ marginBottom: '30px' }}>
              <IonLabel position="stacked">Condición / Diagnóstico</IonLabel>
              <IonTextarea
                value={editCondition}
                onIonInput={e => setEditCondition(String(e.detail.value))}
                autoGrow={true}
                placeholder="Ej: Hipertensión, Alzheimer etapa 1..."
              />
            </IonItem>

            <button
              className="care-btn shadow-premium"
              onClick={handleSavePatient}
              disabled={saving}
              style={{ width: '100%', margin: 0 }}
            >
              {saving ? <IonSpinner name="dots" /> : (
                <>
                  <IonIcon icon={saveOutline} style={{ marginRight: '8px' }} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default CarePatients;
