import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonModal,
  IonButton,
  IonItem,
  IonInput,
  IonLabel,
  IonToggle,
  IonDatetime,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonFooter,
  IonPage,
  IonFab,
  IonFabButton
} from "@ionic/react";
import {
  medkit,
  flask,
  water,
  bandage,
  thermometer,
  qrCodeOutline,
  chevronForwardOutline,
  chevronBackOutline,
  leaf,
  nutrition,
  beaker,
  trashOutline,
  createOutline,
  ellipsisVertical,
  addCircleOutline,
  timeOutline,
  closeOutline,
  add
} from "ionicons/icons";
import { api } from "../../api/axios";
import { useParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import StatusModal from "../../components/StatusModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import "./CarePage.css";

const DAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const ICONS = [
  { id: "medkit", icon: medkit },
  { id: "flask", icon: flask },
  { id: "water", icon: water },
  { id: "bandage", icon: bandage },
  { id: "thermometer", icon: thermometer },
  { id: "nutrition", icon: nutrition },
  { id: "beaker", icon: beaker },
  { id: "leaf", icon: leaf },
];
const CATEGORIES = ["Analgésico", "Vitamina", "Antibiótico", "Suplemento", "Antidepresivo", "Otro"];

type Med = {
  id: number;
  name: string;
  dosage: string;
  time: string;
  days: string[];
  slot?: number;
  icon?: string;
  instructions?: string;
  category?: string;
  imageUrls?: string[];
};

const CareMedicines: React.FC = () => {
  const { patientId: routePatientId } = useParams<{ patientId: string }>();
  const { token } = useAuth();

  const [meds, setMeds] = useState<Med[]>([]);
  const [open, setOpen] = useState(false);
  const [editingMedId, setEditingMedId] = useState<number | null>(null);
  const [galleryMed, setGalleryMed] = useState<Med | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [patients, setPatients] = useState<any[]>([]);
  const [activePatientId, setActivePatientId] = useState<string | null>(routePatientId || localStorage.getItem("activePatientId"));

  // Form State
  const [manualName, setManualName] = useState("");
  const [manualDose, setManualDose] = useState("1 tableta");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [currentTime, setCurrentTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Lu", "Ma", "Mi", "Ju", "Vi"]);
  const [label, setLabel] = useState("");
  const [repeat, setRepeat] = useState(true);
  const [slot, setSlot] = useState(0);
  const [selectedIcon, setSelectedIcon] = useState("medkit");
  const [instructions, setInstructions] = useState("");
  const [category, setCategory] = useState("General");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<'frequency' | 'manual'>('frequency');
  const [selectedInterval, setSelectedInterval] = useState<number | null>(8);
  const [inventory, setInventory] = useState<any[]>([]);
  const [medToDelete, setMedToDelete] = useState<Med | null>(null);

  // Status Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ type: 'success' | 'error' | 'warning' | 'info', title: string, message: string }>({
    type: 'success',
    title: '',
    message: ''
  });

  const showStatus = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalOpen(true);
  };

  useEffect(() => {
    if (scheduleMode === 'frequency' && selectedInterval) {
      const newTimes = [];
      let [h, m] = currentTime.split(":").map(Number);
      const count = Math.floor(24 / selectedInterval);
      for (let i = 0; i < count; i++) {
        const time = `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        newTimes.push(time);
        h += selectedInterval;
      }
      setTimes(newTimes); // Removed .sort() to keep the user's "First Dose" at the top
    }
  }, [currentTime, selectedInterval, scheduleMode]);

  useEffect(() => {
    if (routePatientId) {
      localStorage.setItem("activePatientId", routePatientId);
      setActivePatientId(routePatientId);
    }
  }, [routePatientId]);

  useEffect(() => {
    // Si no hay token, no intentar nada hasta que AuthContext lo proporcione
    if (!localStorage.getItem("token")) return;

    loadPatients(); // Cargar siempre para tener los nombres disponibles en la UI
    if (activePatientId) {
      loadMeds(activePatientId);
      loadInventory();
    }
  }, [activePatientId]);

  const loadInventory = async () => {
    try {
      const res = await api.get("/robot/inventory");
      setInventory(res.data);
    } catch (err) {
      console.error("Error cargando inventario:", err);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data);
    } catch (err: any) {
      console.error("Error cargando pacientes:", err);
    }
  };

  const loadMeds = (id: string | number) => {
    api.get(`/patients/${id}/medicines`)
      .then(res => setMeds(res.data))
      .catch(err => {
        console.error("Error cargando medicinas:", err);
        // Si el paciente no se encuentra o no pertenece al cuidador, limpiar
        if (err.response?.status === 404 || err.response?.status === 403) {
          setActivePatientId(null);
          localStorage.removeItem("activePatientId");
        }
      });
  };

  const toggleDay = (d: string) => {
    setSelectedDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (imageUrls.length >= 3) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setImageUrls(prev => {
            if (prev.length >= 3) return prev;
            return [...prev, base64];
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const saveMed = async () => {
    if (!manualName.trim()) {
      showStatus('warning', 'Falta información', 'El nombre del medicamento es obligatorio.');
      return;
    }
    if (!activePatientId) {
      showStatus('error', 'Error', 'No hay un paciente seleccionado.');
      return;
    }

    const payload = {
      name: manualName.trim(),
      dosage: manualDose,
      times: times, // Enviar array de horas
      days: repeat ? selectedDays : [],
      label,
      slot,
      icon: selectedIcon,
      instructions,
      category,
      imageUrls,
    };

    try {
      if (editingMedId) {
        // ACTUALIZAR
        const res = await api.patch(`/patients/${activePatientId}/medicines/${editingMedId}`, payload);
        setMeds(meds.map(m => m.id === editingMedId ? res.data : m));
      } else {
        // CREAR NUEVO
        const res = await api.post(`/patients/${activePatientId}/medicines`, payload);
        setMeds([res.data, ...meds]);
      }
      setOpen(false);
      resetForm();
      const patientName = patients.find(p => p.id.toString() === activePatientId)?.name || "el paciente";
      showStatus('success', '¡Guardado!', `${editingMedId ? 'Medicina actualizada' : 'Nueva medicina añadida'} correctamente para ${patientName}.`);
    } catch (err: any) {
      console.error("Error guardando medicina:", err);
      showStatus('error', 'Error', 'No se pudo guardar la medicina.');
    }
  };

  const handleEdit = (m: Med) => {
    setEditingMedId(m.id);
    setManualName(m.name);
    setManualDose(m.dosage);

    // Handle times from reminders if present
    const mReminders = (m as any).reminders;
    if (mReminders && mReminders.length > 0) {
      setTimes(mReminders.map((r: any) => r.time));
    } else {
      setTimes([m.time || "08:00"]);
    }

    setSelectedDays(m.days || ["Lu", "Ma", "Mi", "Ju", "Vi"]);
    setRepeat(m.days && m.days.length > 0);
    setSlot(m.slot || 0);
    setSelectedIcon(m.icon || "medkit");
    setInstructions(m.instructions || "");
    setCategory(m.category || "General");
    setImageUrls(m.imageUrls || []);

    setOpen(true);
  };

  const handleDelete = (m: Med) => {
    setMedToDelete(m);
  };

  const confirmDeleteMed = async () => {
    if (!medToDelete) return;
    try {
      await api.delete(`/patients/${activePatientId}/medicines/${medToDelete.id}`);
      setMeds(meds.filter(m => m.id !== medToDelete.id));
      setMedToDelete(null);
      showStatus('success', 'Eliminado', 'El medicamento ha sido borrado.');
    } catch (err) {
      console.error("Error eliminando medicina:", err);
      showStatus('error', 'Error', 'No se pudo eliminar el medicamento.');
    }
  };

  const resetForm = () => {
    setManualName("");
    setManualDose("1 tableta");
    setTimes(["08:00"]);
    setCurrentTime("08:00");
    setSelectedDays(["Lu", "Ma", "Mi", "Ju", "Vi"]);
    setLabel("");
    setRepeat(true);
    setSlot(0);
    setSelectedIcon("medkit");
    setInstructions("");
    setCategory("General");
    setImageUrls([]);
    setEditingMedId(null);
  };

  const getIconById = (id: string) => {
    return ICONS.find(i => i.id === id)?.icon || medkit;
  };

  return (
    <IonPage>
      <IonContent fullscreen className="care-page">
        <div className="care-bubble b1" />
        <div className="care-bubble b2" />

        <div className="care-container">
          <h1 className="care-title" style={{ fontSize: '1.8rem' }}>
            {activePatientId ? `Medicamentos para ${patients.find(p => p.id.toString() === activePatientId)?.name || 'Paciente'}` : 'Medicamentos'}
          </h1>
          <p className="care-subtitle">Gestiona y añade las medicinas del tratamiento</p>

          {activePatientId && patients.find(p => p.id.toString() === activePatientId) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              background: 'white',
              padding: '15px 22px',
              borderRadius: '24px',
              marginBottom: '25px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.02)'
            }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '15px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>
                {patients.find(p => p.id.toString() === activePatientId)?.name?.charAt(0) || 'P'}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Paciente Activo</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{patients.find(p => p.id.toString() === activePatientId)?.name}</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>
                  Código: <span style={{ fontWeight: 700 }}>{patients.find(p => p.id.toString() === activePatientId)?.linkCode || '---'}</span>
                </p>
              </div>
            </div>
          )}
          {!activePatientId && (
            <div className="patient-selector-fallback care-card" style={{ marginTop: '20px', background: 'rgba(255,152,0,0.1)', border: '1px solid orange' }}>
              <h3 style={{ color: '#e65100', marginTop: 0 }}>⚠️ Selecciona un paciente primero</h3>
              <p style={{ fontSize: '0.9rem' }}>Para gestionar medicinas, debes elegir a quién pertenecen:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                {patients.map(p => (
                  <button key={p.id} className="care-btn-outline" onClick={() => {
                    localStorage.setItem("activePatientId", p.id.toString());
                    setActivePatientId(p.id.toString());
                  }} style={{ padding: '12px 20px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontWeight: 800 }}>{p.name}</span>
                    {p.linkCode && (
                      <span style={{ fontSize: '0.7rem', opacity: 0.7, background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
                        Código: {p.linkCode}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <IonButton className="qr-btn" onClick={() => showStatus('warning', 'Próximamente', 'El escaneo de recetas por QR estará disponible muy pronto.')}>
            <IonIcon icon={qrCodeOutline} style={{ fontSize: "1.3rem" }} />
          </IonButton>

          <button className="care-btn shadow-premium" onClick={() => {
            if (!activePatientId) {
              showStatus('warning', 'Selecciona un Paciente', 'Debes elegir un paciente de la lista antes de añadir medicinas.');
              return;
            }
            setOpen(true);
          }} style={{ position: 'sticky', top: '10px', zIndex: 100, marginBottom: '30px' }}>
            <IonIcon icon={addCircleOutline} style={{ marginRight: '8px', fontSize: '1.4rem' }} />
            Añadir medicamento
          </button>

          <div className="meds-list" style={{ width: '100%', marginTop: '20px' }}>
            {activePatientId && meds.length === 0 && (
              <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.6 }}>
                <IonIcon icon={medkit} style={{ fontSize: '4rem', marginBottom: '10px' }} />
                <p>No hay medicinas registradas para este paciente.</p>
              </div>
            )}
            {meds.map(m => (
              <div className="care-card" key={m.id}>
                {/* Header (Photo + Name + Actions) */}
                <div className="med-card-header">
                  <div className="med-photo-wrapper"
                    onClick={() => { if (m.imageUrls && m.imageUrls.length > 0) { setGalleryMed(m); setGalleryIdx(0); } }}
                    style={{ cursor: m.imageUrls && m.imageUrls.length > 0 ? 'pointer' : 'default' }}>
                    {m.imageUrls && m.imageUrls.length > 0 ? (
                      <>
                        <img src={m.imageUrls[0]} alt={m.name} />
                        {m.imageUrls.length > 1 && (
                          <div className="med-photo-badge">+{m.imageUrls.length - 1}</div>
                        )}
                      </>
                    ) : (
                      <IonIcon icon={getIconById(m.icon || 'medkit')} style={{ color: 'var(--primary)', fontSize: '2rem' }} />
                    )}
                  </div>

                  <div className="med-info-main">
                    <h3>{m.name}</h3>
                    <p className="med-dosage-text">{m.dosage}</p>
                    <span className="med-category-tag">{m.category || 'General'}</span>
                  </div>

                  <div className="med-actions-top">
                    <button className="med-action-btn edit" onClick={() => handleEdit(m)}>
                      <IonIcon icon={createOutline} />
                    </button>
                    <button className="med-action-btn delete" onClick={() => handleDelete(m)}>
                      <IonIcon icon={trashOutline} />
                    </button>
                  </div>
                </div>

                {/* Data Grid (Schedules + Slot) */}
                <div className="med-data-grid">
                  <div className="med-data-box">
                    <div className="med-data-icon" style={{ background: '#e0f2fe' }}>
                      <IonIcon icon={timeOutline} style={{ color: '#0288d1' }} />
                    </div>
                    <div className="med-data-content">
                      <label>Horarios</label>
                      <span>
                        {(m as any).reminders?.length > 0
                          ? (m as any).reminders.map((r: any) => r.time).join(", ")
                          : m.time}
                      </span>
                    </div>
                  </div>

                  <div className="med-data-box">
                    <div className="med-data-icon" style={{ background: '#f5f3ff' }}>
                      <IonIcon icon={medkit} style={{ color: '#8b5cf6' }} />
                    </div>
                    <div className="med-data-content">
                      <label>Carril</label>
                      <span>Motor {m.slot}</span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                {m.instructions && (
                  <div className="med-instructions-pill">
                    <span>📝 {m.instructions}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <IonModal
          isOpen={open}
          onDidDismiss={() => { setOpen(false); resetForm(); }}
          className="med-modal-advanced"
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '90vh',
            background: 'white',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{ padding: '25px 25px 15px', borderBottom: '1px solid #eee', flexShrink: 0, background: 'white', zIndex: 10 }}>
              <h2 className="modal-title" style={{ margin: 0, textAlign: 'left', color: '#0288d1', fontWeight: 700 }}>
                {editingMedId ? "Editar Medicina" : "Configuración de Medicina"}
              </h2>
              <p className="modal-subtitle" style={{ margin: '5px 0 0', textAlign: 'left', color: '#666', fontSize: '0.85rem' }}>
                {editingMedId ? "Modifica los detalles del tratamiento" : "Especificaciones detalladas para el robot y el paciente"}
              </p>
            </div>

            {/* Body (Scrollable) */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 20px 120px',
              WebkitOverflowScrolling: 'touch',
              background: 'white',
              overscrollBehavior: 'contain'
            }}>
              <div className="modal-inner" style={{ padding: 0 }}>
                {/* 1. MEDICINE SELECTION & CORE DETAILS */}
                <div style={{ padding: '0 5px' }}>
                  <IonItem lines="full" className="input-premium">
                    <IonLabel position="stacked" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>Seleccionar Medicamento (Inventario Robot)</IonLabel>
                    {inventory.length > 0 ? (
                      <IonSelect
                        value={inventory.find(i => i.medicineName === manualName)?.id}
                        onIonChange={e => {
                          const selectedInv = inventory.find(i => i.id === e.detail.value);
                          if (selectedInv) {
                            setManualName(selectedInv.medicineName);
                            setSlot(selectedInv.slot);
                          }
                        }}
                        placeholder="Elige una medicina del robot"
                        interface="popover"
                        className="pro-select-ion"
                      >
                        {inventory.map(inv => (
                          <IonSelectOption key={inv.id} value={inv.id}>
                            {inv.medicineName} (Carril {inv.slot})
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    ) : (
                      <div style={{ padding: '10px 0', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                        ⚠️ Configura el inventario en el panel de control.
                      </div>
                    )}
                  </IonItem>

                  <div style={{ display: 'flex', gap: '15px' }}>
                    <IonItem lines="full" className="input-premium" style={{ flex: 1 }}>
                      <IonLabel position="stacked" style={{ fontSize: '0.85rem' }}>Dosis</IonLabel>
                      <IonInput value={manualDose} onIonInput={e => setManualDose(String(e.detail.value))} placeholder="Ej: 1 tableta" />
                    </IonItem>
                    <IonItem lines="full" className="input-premium" style={{ flex: 1 }}>
                      <IonLabel position="stacked" style={{ fontSize: '0.85rem' }}>Categoría</IonLabel>
                      <IonSelect value={category} onIonChange={e => setCategory(e.detail.value)} interface="popover">
                        {CATEGORIES.map(c => <IonSelectOption key={c} value={c}>{c}</IonSelectOption>)}
                      </IonSelect>
                    </IonItem>
                  </div>
                </div>

                {/* 2. VISUALS (IMAGES & ICONS) */}
                <div style={{ marginTop: '30px', padding: '0 5px' }}>
                  <IonLabel style={{ fontWeight: 700, display: 'block', marginBottom: '15px', color: '#475569', fontSize: '0.9rem' }}>Identificación Visual</IonLabel>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    {[0, 1, 2].map(idx => (
                      <div
                        key={idx}
                        style={{
                          width: '75px',
                          height: '75px',
                          borderRadius: '18px',
                          background: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          border: imageUrls[idx] ? '2px solid var(--primary)' : '2px dashed #e2e8f0',
                          position: 'relative',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => {
                          if (!imageUrls[idx]) document.getElementById('med-photo-input')?.click();
                        }}
                      >
                        {imageUrls[idx] ? (
                          <>
                            <img src={imageUrls[idx]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div
                              onClick={(e) => { e.stopPropagation(); setImageUrls(imageUrls.filter((_, i) => i !== idx)); }}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(239, 68, 68, 0.9)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >×</div>
                          </>
                        ) : (
                          <IonIcon icon={addCircleOutline} style={{ color: '#cbd5e0', fontSize: '1.4rem' }} />
                        )}
                      </div>
                    ))}
                    <input type="file" id="med-photo-input" hidden accept="image/*" multiple onChange={handleFileChange} />
                  </div>

                  <div className="icons-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '5px 0' }}>
                    {ICONS.map(item => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedIcon(item.id)}
                        style={{
                          minWidth: '45px',
                          height: '45px',
                          borderRadius: '12px',
                          background: selectedIcon === item.id ? 'var(--primary-gradient)' : '#f1f5f9',
                          color: selectedIcon === item.id ? 'white' : '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: '0.3s'
                        }}
                      >
                        <IonIcon icon={item.icon} style={{ fontSize: '1.2rem' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. EXTRA INFO */}
                <IonItem lines="full" className="input-premium" style={{ marginTop: '20px' }}>
                  <IonLabel position="stacked" style={{ fontSize: '0.85rem' }}>Instrucciones Especiales (Opcional)</IonLabel>
                  <IonTextarea
                    value={instructions}
                    onIonInput={e => setInstructions(String(e.detail.value))}
                    placeholder="Ej. Tomar con mucha agua..."
                    autoGrow={true}
                  />
                </IonItem>

                {/* 4. SCHEDULING (TIME PLAN) */}
                <div className="scheduling-premium" style={{ marginTop: '35px', padding: '22px', background: '#f8fafc', borderRadius: '28px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <IonLabel style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                      <IonIcon icon={timeOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Planificación
                    </IonLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Repetir</span>
                      <IonToggle checked={repeat} onIonChange={e => setRepeat(e.detail.checked)} style={{ transform: 'scale(0.8)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: '12px', marginBottom: '18px' }}>
                    <button
                      type="button"
                      onClick={() => setScheduleMode('frequency')}
                      style={{ flex: 1, padding: '9px', borderRadius: '10px', border: 'none', background: scheduleMode === 'frequency' ? 'white' : 'transparent', fontWeight: 700, color: scheduleMode === 'frequency' ? 'var(--primary)' : '#64748b', fontSize: '0.85rem', transition: '0.2s' }}
                    >Frecuencia</button>
                    <button
                      type="button"
                      onClick={() => setScheduleMode('manual')}
                      style={{ flex: 1, padding: '9px', borderRadius: '10px', border: 'none', background: scheduleMode === 'manual' ? 'white' : 'transparent', fontWeight: 700, color: scheduleMode === 'manual' ? 'var(--primary)' : '#64748b', fontSize: '0.85rem', transition: '0.2s' }}
                    >Manual</button>
                  </div>

                  {scheduleMode === 'frequency' ? (
                    <div style={{ animation: 'fadeIn 0.2s ease' }}>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', overflowX: 'auto', paddingBottom: '5px' }}>
                        {[4, 6, 8, 12, 24].map(h => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setSelectedInterval(h)}
                            style={{ padding: '10px 14px', borderRadius: '12px', background: selectedInterval === h ? 'var(--primary)' : 'white', color: selectedInterval === h ? 'white' : 'var(--primary)', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 700, transition: '0.2s' }}
                          >{h}h</button>
                        ))}
                      </div>
                      <div
                        className="time-picker-container-pro"
                        style={{
                          background: parseInt(currentTime.split(':')[0]) >= 19 || parseInt(currentTime.split(':')[0]) < 6
                            ? 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)'
                            : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div className="time-picker-visual-hint">
                          {parseInt(currentTime.split(':')[0]) >= 19 || parseInt(currentTime.split(':')[0]) < 6 ? '🌙' : '☀️'}
                        </div>
                        <IonDatetime
                          presentation="time"
                          preferWheel={true}
                          hourCycle="h23"
                          value={`2024-01-01T${currentTime}`}
                          onIonChange={e => setCurrentTime(String(e.detail.value).substring(11, 16))}
                          style={{ '--background': 'transparent', fontSize: '1.2rem', fontWeight: 800, '--color': 'white', width: '100%' } as any}
                        />
                        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', fontWeight: 700, paddingRight: '15px', zIndex: 2 }}>Primera toma</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ animation: 'fadeIn 0.2s ease' }}>
                      <div
                        className="time-picker-container-pro"
                        style={{
                          background: parseInt(currentTime.split(':')[0]) >= 19 || parseInt(currentTime.split(':')[0]) < 6
                            ? 'linear-gradient(135deg, #2c3e50, #000000)'
                            : 'linear-gradient(135deg, #00c6ff, #0072ff)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div className="time-picker-visual-hint">
                          {parseInt(currentTime.split(':')[0]) >= 19 || parseInt(currentTime.split(':')[0]) < 6 ? '🌙' : '☀️'}
                        </div>
                        <IonDatetime
                          presentation="time"
                          preferWheel={true}
                          hourCycle="h23"
                          value={`2024-01-01T${currentTime}`}
                          onIonChange={e => setCurrentTime(String(e.detail.value).substring(11, 16))}
                          style={{ '--background': 'transparent', fontSize: '1.2rem', fontWeight: 800, '--color': 'white', width: '100%' } as any}
                        />
                        <button
                          type="button"
                          onClick={() => { if (!times.includes(currentTime)) setTimes([...times, currentTime].sort()); }}
                          style={{ marginLeft: 'auto', padding: '10px 20px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.85rem', backdropFilter: 'blur(10px)', zIndex: 2 }}
                        >Añadir</button>
                      </div>
                    </div>
                  )}

                  {/* Timeline logic remains pretty same but more compact */}
                  <div style={{ position: 'relative', marginTop: '20px', paddingLeft: '15px' }}>
                    <div style={{ position: 'absolute', left: '5px', top: '5px', bottom: '5px', width: '2px', background: '#e2e8f0', borderRadius: '2px' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {times.map((t, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'white', border: '2px solid var(--primary)', position: 'relative', left: '-14px', zIndex: 2 }}></div>
                          <div style={{ flex: 1, background: 'white', padding: '10px 14px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #f8fafc', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>{t}</span>
                            <button
                              type="button"
                              onClick={() => setTimes(times.filter((_, i) => i !== idx))}
                              style={{ background: 'transparent', color: '#ef4444', border: 'none', fontSize: '18px', fontWeight: 800 }}
                            >×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {repeat && (
                  <div style={{ marginTop: '25px', padding: '0 5px' }}>
                    <IonLabel style={{ fontWeight: 700, color: '#64748b', marginBottom: '10px', display: 'block', fontSize: '0.85rem' }}>Días activos</IonLabel>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
                      {DAYS.map(d => (
                        <div key={d} className={`day-chip-lite ${selectedDays.includes(d) ? "active" : ""}`} onClick={() => toggleDay(d)}
                          style={{
                            flex: 1, height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700,
                            background: selectedDays.includes(d) ? 'var(--primary)' : '#f1f5f9',
                            color: selectedDays.includes(d) ? 'white' : '#94a3b8',
                            transition: 'all 0.2s'
                          }}
                        >{d}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ height: '40px' }}></div>
              </div>
            </div>

            {/* Footer (Pinned) */}
            <div style={{ padding: '15px 25px 30px', borderTop: '1px solid #eee', flexShrink: 0, background: 'white', zIndex: 10 }}>
              <div className="modal-actions" style={{ display: 'flex', gap: '15px' }}>
                <button
                  className="care-btn-outline"
                  onClick={() => setOpen(false)}
                  style={{
                    flex: 1,
                    padding: '15px',
                    borderRadius: '15px',
                    border: '2px solid #cbd5e0',
                    background: 'transparent',
                    color: '#5c6b7a',
                    fontWeight: 700
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="care-btn-save"
                  onClick={saveMed}
                  style={{
                    flex: 2,
                    padding: '15px',
                    borderRadius: '15px',
                    background: 'var(--primary-gradient)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 800,
                    boxShadow: '0 4px 15px rgba(2, 136, 209, 0.3)'
                  }}
                >
                  {editingMedId ? "Actualizar Medicina" : "Guardar Medicina"}
                </button>
              </div>
            </div>
          </div>
        </IonModal>

        {/* 🖼️ PREMIUM GALLERY OVERLAY */}
        <IonModal
          isOpen={!!galleryMed}
          onDidDismiss={() => setGalleryMed(null)}
          style={{ '--background': 'transparent' }}
        >
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, rgba(20,20,25,0.95) 0%, rgba(10,10,12,1) 100%)',
            color: 'white',
            position: 'relative',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}>
            {/* Transparent Header */}
            <div style={{
              padding: '40px 25px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 10
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>{galleryMed?.name}</h2>
                <p style={{ margin: '4px 0 0', opacity: 0.6, fontSize: '0.9rem' }}>{galleryMed?.dosage}</p>
              </div>
              <button
                onClick={() => setGalleryMed(null)}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <IonIcon icon={closeOutline} style={{ fontSize: '1.5rem' }} />
              </button>
            </div>

            {/* Main Viewport */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '10px'
            }}>
              {galleryIdx > 0 && (
                <button
                  onClick={() => setGalleryIdx(galleryIdx - 1)}
                  style={{
                    position: 'absolute',
                    left: '15px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.4)',
                    border: 'none',
                    color: 'white',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <IonIcon icon={chevronBackOutline} style={{ fontSize: '1.8rem' }} />
                </button>
              )}

              <div style={{
                width: '100%',
                height: '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '30px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                background: 'rgba(255,255,255,0.02)'
              }}>
                <img
                  src={galleryMed?.imageUrls?.[galleryIdx]}
                  alt="Gallery"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>

              {galleryMed?.imageUrls && galleryIdx < galleryMed.imageUrls.length - 1 && (
                <button
                  onClick={() => setGalleryIdx(galleryIdx + 1)}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.4)',
                    border: 'none',
                    color: 'white',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <IonIcon icon={chevronForwardOutline} style={{ fontSize: '1.8rem' }} />
                </button>
              )}
            </div>

            {/* Footer Indicators */}
            <div style={{ padding: '30px 20px 50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                {galleryMed?.imageUrls?.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setGalleryIdx(i)}
                    style={{
                      width: i === galleryIdx ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '10px',
                      background: i === galleryIdx ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>

              <span style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                Foto {galleryIdx + 1} de {galleryMed?.imageUrls?.length}
              </span>
            </div>
          </div>
        </IonModal>

        <ConfirmationModal
          isOpen={!!medToDelete}
          type="danger"
          title="¿Eliminar Medicamento?"
          message={`¿Estás seguro que deseas eliminar <strong>${medToDelete?.name}</strong>? Esta acción quitará el medicamento del recordatorio del paciente.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmDeleteMed}
          onCancel={() => setMedToDelete(null)}
        />
        <StatusModal
          isOpen={modalOpen}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={() => setModalOpen(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default CareMedicines;
