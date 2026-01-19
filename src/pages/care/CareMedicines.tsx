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
import "./CarePage.css";
import { IoQrCodeOutline } from "react-icons/io5";
import { api } from "../../api/axios";
import { useParams } from "react-router";
import { useAuth } from "../../context/AuthContext";

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
    if (!token || !activePatientId) {
      if (!activePatientId) loadPatients(); // Si no hay paciente, cargar lista para elegir
      return;
    }
    loadMeds(activePatientId);
  }, [activePatientId, token]);

  const loadPatients = async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data);
    } catch (err) {
      console.error("Error cargando pacientes:", err);
    }
  };

  const loadMeds = (id: string | number) => {
    api.get(`/patients/${id}/medicines`)
      .then(res => setMeds(res.data))
      .catch(err => console.error("Error cargando medicinas:", err));
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
      alert("El nombre del medicamento es obligatorio.");
      return;
    }
    if (!activePatientId) {
      alert("Error: No hay un paciente seleccionado.");
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
    } catch (err: any) {
      console.error("Error guardando medicina:", err);
      if (err.response?.data) {
        console.error("Detalle del error:", err.response.data);
      }
      alert("Error al guardar medicina");
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

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este medicamento?")) return;
    try {
      await api.delete(`/patients/${activePatientId}/medicines/${id}`);
      setMeds(meds.filter(m => m.id !== id));
    } catch (err) {
      console.error("Error eliminando medicina:", err);
      alert("No se pudo eliminar la medicina");
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
          <h1 className="care-title">Medicamentos</h1>
          <p className="care-subtitle">Gestiona y añade tus medicinas</p>

          {activePatientId && patients.find(p => p.id.toString() === activePatientId) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'white',
              padding: '10px 20px',
              borderRadius: '15px',
              marginBottom: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.03)'
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                {patients.find(p => p.id.toString() === activePatientId)?.name?.charAt(0) || 'P'}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{patients.find(p => p.id.toString() === activePatientId)?.name || 'Paciente'}</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>
                  Código de vinculación: <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{patients.find(p => p.id.toString() === activePatientId)?.linkCode || '---'}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("activePatientId");
                  setActivePatientId(null);
                }}
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}
              >
                Cambiar
              </button>
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

          <IonButton className="qr-btn" onClick={() => alert("Próximamente: Escaneo QR")}>
            <IonIcon icon={qrCodeOutline} style={{ fontSize: "1.3rem" }} />
          </IonButton>

          <button className="care-btn shadow-premium" onClick={() => {
            if (!activePatientId) {
              alert("Por favor, selecciona un paciente primero.");
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
                    <button className="med-action-btn delete" onClick={() => handleDelete(m.id)}>
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
                {/* 📸 MULTI-IMAGE UPLOAD SECTION */}
                <div className="image-upload-section" style={{ marginBottom: '25px' }}>
                  <IonLabel style={{ fontWeight: 700, display: 'block', marginBottom: '10px', color: 'var(--primary)' }}>Fotos del Medicamento (Máx 3)</IonLabel>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {[0, 1, 2].map(idx => (
                      <div
                        key={idx}
                        style={{
                          width: '85px',
                          height: '85px',
                          borderRadius: '20px',
                          background: '#f0f4f8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          border: imageUrls[idx] ? '2px solid var(--primary)' : '2px dashed #cbd5e0',
                          position: 'relative'
                        }}
                        onClick={() => {
                          if (!imageUrls[idx]) document.getElementById('med-photo-input')?.click();
                        }}
                      >
                        {imageUrls[idx] ? (
                          <>
                            <img src={imageUrls[idx]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              onClick={(e) => { e.stopPropagation(); setImageUrls(imageUrls.filter((_, i) => i !== idx)); }}
                              style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                background: '#ff5252',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >×</button>
                          </>
                        ) : (
                          <div style={{ color: '#718096', textAlign: 'center' }}>
                            <IonIcon icon={medkit} style={{ fontSize: '1.5rem' }} />
                          </div>
                        )}
                      </div>
                    ))}
                    {imageUrls.length < 3 && (
                      <input
                        type="file"
                        id="med-photo-input"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                      />
                    )}
                  </div>
                </div>

                <div className="icon-selector-premium" style={{ marginBottom: '20px' }}>
                  <IonLabel style={{ fontWeight: 700, display: 'block', marginBottom: '10px', color: 'var(--primary)' }}>Icono Alternativo (Opcional)</IonLabel>
                  <div className="icons-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '5px' }}>
                    {ICONS.map(item => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedIcon(item.id)}
                        style={{
                          width: '50px',
                          height: '50px',
                          minWidth: '50px',
                          borderRadius: '12px',
                          background: selectedIcon === item.id ? 'var(--primary-gradient)' : '#f0f4f8',
                          color: selectedIcon === item.id ? 'white' : '#5c6b7a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: '0.3s',
                          boxShadow: selectedIcon === item.id ? '0 4px 15px rgba(2, 136, 209, 0.4)' : 'none'
                        }}
                      >
                        <IonIcon icon={item.icon} style={{ fontSize: '1.4rem' }} />
                      </div>
                    ))}
                  </div>
                </div>

                <IonItem lines="full" className="input-premium">
                  <IonLabel position="stacked">Nombre del Medicamento</IonLabel>
                  <IonInput value={manualName} onIonInput={e => setManualName(String(e.detail.value))} placeholder="Ej. Paracetamol" />
                </IonItem>

                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <IonItem lines="full" className="input-premium" style={{ flex: 1 }}>
                    <IonLabel position="stacked">Dosis</IonLabel>
                    <IonInput value={manualDose} onIonInput={e => setManualDose(String(e.detail.value))} />
                  </IonItem>
                  <IonItem lines="full" className="input-premium" style={{ flex: 1 }}>
                    <IonLabel position="stacked">Categoría</IonLabel>
                    <IonSelect value={category} onIonChange={e => setCategory(e.detail.value)} interface="popover">
                      {CATEGORIES.map(c => <IonSelectOption key={c} value={c}>{c}</IonSelectOption>)}
                    </IonSelect>
                  </IonItem>
                </div>

                <IonItem lines="full" className="input-premium" style={{ marginTop: '10px' }}>
                  <IonLabel position="stacked">Instrucciones Especiales</IonLabel>
                  <IonTextarea
                    value={instructions}
                    onIonInput={e => setInstructions(String(e.detail.value))}
                    placeholder="Ej. Tomar con mucha agua después del almuerzo."
                    autoGrow={true}
                  />
                </IonItem>

                <div className="scheduling-premium" style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                  <IonLabel style={{ fontWeight: 800, color: 'var(--primary)', display: 'block', marginBottom: '8px', fontSize: '1.2rem' }}>
                    <IonIcon icon={timeOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Plan de Administración
                  </IonLabel>

                  <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', marginBottom: '20px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setScheduleMode('frequency')}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: scheduleMode === 'frequency' ? 'white' : 'transparent', fontWeight: 800, color: scheduleMode === 'frequency' ? 'var(--primary)' : '#64748b', transition: '0.3s', fontSize: '0.9rem' }}
                    >Por Frecuencia</button>
                    <button
                      type="button"
                      onClick={() => setScheduleMode('manual')}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: scheduleMode === 'manual' ? 'white' : 'transparent', fontWeight: 800, color: scheduleMode === 'manual' ? 'var(--primary)' : '#64748b', transition: '0.3s', fontSize: '0.9rem' }}
                    >Manual</button>
                  </div>

                  {scheduleMode === 'frequency' ? (
                    <div className="frequency-mode-ui" style={{ animation: 'fadeIn 0.3s ease' }}>
                      <IonLabel style={{ fontWeight: 700, display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: '#475569' }}>¿Cada cuántas horas?</IonLabel>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
                        {[4, 6, 8, 12, 24].map(h => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setSelectedInterval(h)}
                            style={{
                              padding: '12px 18px',
                              borderRadius: '14px',
                              background: selectedInterval === h ? 'var(--primary)' : 'white',
                              color: selectedInterval === h ? 'white' : 'var(--primary)',
                              border: '1.5px solid #e0e6ed',
                              fontSize: '0.9rem',
                              fontWeight: 800,
                              minWidth: '70px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                              transition: '0.2s'
                            }}
                          >
                            {h}h
                          </button>
                        ))}
                      </div>

                      <IonLabel style={{ fontWeight: 700, display: 'block', marginBottom: '12px', fontSize: '0.85rem', color: '#475569' }}>Hora de la primera toma</IonLabel>
                      <div style={{ background: 'white', borderRadius: '24px', padding: '10px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                        <IonDatetime
                          presentation="time"
                          preferWheel={true}
                          value={`2024-01-01T${currentTime}`}
                          onIonChange={e => setCurrentTime(String(e.detail.value).substring(11, 16))}
                          style={{ '--background': 'transparent', fontSize: '1.3rem', fontWeight: 800, '--color': '#1a202c', width: '100%', maxWidth: '200px' } as any}
                        />
                        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700 }}>Primera toma</span>
                      </div>
                    </div>
                  ) : (
                    <div className="manual-mode-ui" style={{ animation: 'fadeIn 0.3s ease' }}>
                      <IonLabel style={{ fontWeight: 700, display: 'block', marginBottom: '12px', fontSize: '0.85rem', color: '#475569' }}>Seleccionar Hora</IonLabel>
                      <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '10px 20px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                        marginBottom: '20px'
                      }}>
                        <IonDatetime
                          presentation="time"
                          preferWheel={true}
                          value={`2024-01-01T${currentTime}`}
                          onIonChange={e => setCurrentTime(String(e.detail.value).substring(11, 16))}
                          style={{ '--background': 'transparent', fontSize: '1.3rem', fontWeight: 800, '--color': '#1a202c', width: '100%', maxWidth: '200px' } as any}
                        />
                        <button
                          type="button"
                          onClick={() => { if (!times.includes(currentTime)) setTimes([...times, currentTime].sort()); }}
                          style={{ marginLeft: 'auto', padding: '12px 20px', borderRadius: '14px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(2, 136, 209, 0.25)' }}
                        >Añadir</button>
                      </div>
                    </div>
                  )}

                  {/* Result Timeline (Visible in both modes) */}
                  <div className="times-visual-timeline" style={{ position: 'relative', marginTop: '25px', paddingLeft: '20px' }}>
                    <div style={{ position: 'absolute', left: '7px', top: '5px', bottom: '5px', width: '2px', background: 'linear-gradient(to bottom, #0288d1, #81d4fa, #e2e8f0)', borderRadius: '2px' }}></div>

                    {times.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {times.map((t, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'white', border: '3px solid var(--primary)', position: 'relative', left: '-12px', zIndex: 2, boxShadow: '0 0 0 4px #f8fafc' }}></div>
                            <div style={{
                              flex: 1,
                              background: 'white',
                              padding: '12px 18px',
                              borderRadius: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              border: '1px solid #f1f5f9',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                            }}>
                              <div>
                                <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>{t}</span>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '8px', marginLeft: '10px' }}>
                                  {parseInt(t.split(':')[0]) < 12 ? 'Mañana' : parseInt(t.split(':')[0]) < 18 ? 'Tarde' : 'Noche'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setTimes(times.filter((_, i) => i !== idx))}
                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', width: '30px', height: '30px', fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '30px 20px', textAlign: 'center', background: 'white', borderRadius: '20px', border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>Aún no hay horarios definidos</p>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', padding: '0 5px' }}>
                  <div>
                    <IonLabel style={{ fontWeight: 800, color: '#475569', fontSize: '1rem' }}>Repetir Diariamente</IonLabel>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Activar recordatorios automáticos</p>
                  </div>
                  <IonToggle checked={repeat} onIonChange={e => setRepeat(e.detail.checked)} />
                </div>

                <div className="slot-picker-advanced" style={{ marginTop: '20px' }}>
                  <IonLabel style={{ fontWeight: 700, color: 'var(--primary)' }}>Asignar Carril del Robot</IonLabel>
                  <div className="slots-grid-premium" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginTop: '10px' }}>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <div
                        key={num}
                        className={`slot-box ${slot === num ? "selected" : ""}`}
                        onClick={() => setSlot(num)}
                        style={{
                          height: '50px',
                          borderRadius: '12px',
                          background: slot === num ? 'var(--primary-gradient)' : '#f0f4f8',
                          color: slot === num ? 'white' : '#555',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: '0.3s'
                        }}
                      >
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>M</span>
                        {num}
                      </div>
                    ))}
                  </div>
                </div>

                {repeat && (
                  <div className="days-selector" style={{ marginTop: '40px' }}>
                    <IonLabel style={{ fontWeight: 700, color: '#666', marginBottom: '10px', display: 'block' }}>Días de Repetición</IonLabel>
                    <div className="days-grid" style={{ display: 'flex', gap: '5px', justifyContent: 'space-between' }}>
                      {DAYS.map(d => (
                        <div key={d} className={`day-chip-lite ${selectedDays.includes(d) ? "active" : ""}`} onClick={() => toggleDay(d)}
                          style={{
                            flex: 1, height: '35px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                            background: selectedDays.includes(d) ? 'var(--primary)' : '#f0f4f8',
                            color: selectedDays.includes(d) ? 'white' : '#666',
                            transition: '0.2s'
                          }}
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Espaciador final para asegurar scroll */}
                <div style={{ height: '30px' }}></div>
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

      </IonContent>
    </IonPage>
  );
};

export default CareMedicines;
