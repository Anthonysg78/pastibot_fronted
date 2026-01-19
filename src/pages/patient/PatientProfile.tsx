import React, { useState, useEffect, useRef } from "react";
import { IonContent, IonPage, IonIcon, IonSpinner, IonTextarea } from "@ionic/react";
import {
  call, mail, person, medkit, calendar,
  transgender, cameraOutline, refreshOutline,
  saveOutline, closeOutline, pencilOutline
} from "ionicons/icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/axios";
import "./PatientPage.css";

interface PatientData {
  id: number;
  name: string;
  email: string | null;
  age: number | null;
  gender: string | null;
  condition: string | null;
  bio?: string | null;
  caregiver?: {
    id: number;
    name: string;
    email: string;
    photoUrl?: string;
    gender?: string;
    bio?: string;
  };
}

const PatientProfile: React.FC = () => {
  const { user, logout, getProfile } = useAuth();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tempBio, setTempBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);

  // Clinical Edit State
  const [editingClinical, setEditingClinical] = useState(false);
  const [tempAge, setTempAge] = useState<string>("");
  const [tempCondition, setTempCondition] = useState<string>("");
  const [tempGender, setTempGender] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const res = await api.get("/auth/profile");
      if (res.data.patientProfile) {
        const p = res.data.patientProfile;
        setPatientData(p);
        setTempBio(res.data.bio || "");
        setTempAge(p.age ? p.age.toString() : "");
        setTempCondition(p.condition || "");
        setTempGender(p.gender || res.data.gender || "");
      }
    } catch (err) {
      console.error("Error cargando datos del paciente:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen es muy pesada (máx 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setUploading(true);
      try {
        await api.patch("/users/profile", { photoUrl: base64 });
        if (getProfile) getProfile();
        alert("¡Foto actualizada!");
      } catch (err) {
        console.error("Error subiendo foto:", err);
        alert("No se pudo subir la foto");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBio = async () => {
    setSaving(true);
    try {
      await api.patch("/users/profile", { bio: tempBio });
      if (getProfile) getProfile();
      setEditing(false);
    } catch (err) {
      console.error("Error guardando bio:", err);
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClinical = async () => {
    if (!patientData) return;
    setSaving(true);
    try {
      // Necesitamos el patientId. patientData.id es el id de la tabla Patient
      await api.patch(`/patients/update-my-profile`, {
        age: tempAge ? Number(tempAge) : null,
        condition: tempCondition,
        gender: tempGender
      });
      await loadPatientData();
      if (getProfile) getProfile();
      setEditingClinical(false);
      alert("Perfil clínico actualizado");
    } catch (err) {
      console.error("Error guardando datos clínicos:", err);
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsapp = () => {
    if (patientData?.caregiver) {
      const message = encodeURIComponent(`Hola ${patientData.caregiver.name}, soy ${user?.name} 👋`);
      window.open(`https://wa.me/?text=${message}`, "_blank");
    }
  };

  const handleLogout = () => {
    if (confirm("¿Estás seguro que deseas cerrar sesión?")) {
      logout();
      window.location.href = "/login";
    }
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
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={onFileSelected}
        />
        <div className="patient-bubble b1" />
        <div className="patient-bubble b2" />

        <div className="patient-container fade-in" style={{ paddingBottom: "50px" }}>

          {/* 👤 HEADER DE PERFIL DEL PACIENTE */}
          <div className="patient-profile-hero">
            <div className="patient-avatar-wrapper">
              <img
                src={user?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt="Mi Perfil"
                className="patient-avatar-pro"
                style={{ opacity: uploading ? 0.5 : 1 }}
              />
              <div className={`edit-photo-badge ${uploading ? 'uploading' : ''}`} onClick={handlePhotoClick}>
                <IonIcon icon={uploading ? refreshOutline : cameraOutline} />
              </div>
            </div>

            <h1 className="patient-profile-name">{user?.name}</h1>
            <div className="patient-profile-email">
              <IonIcon icon={mail} /> {user?.email}
            </div>

            {!editing ? (
              <div onClick={() => setEditing(true)} style={{ cursor: "pointer" }}>
                <div className="patient-bio-bubble">
                  {user?.bio || "Presiona para agregar una biografía..."}
                  <IonIcon icon={pencilOutline} style={{ marginLeft: "8px", fontSize: "0.8rem" }} />
                </div>
              </div>
            ) : (
              <div style={{ marginTop: "15px", width: "100%" }}>
                <textarea
                  className="patient-bio-edit"
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  placeholder="Escribe algo sobre ti..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '15px',
                    border: '1px solid var(--primary)',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem'
                  }}
                />
                <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "10px" }}>
                  <button className="care-btn small outline" onClick={() => setEditing(false)} style={{ margin: 0 }}>
                    <IonIcon icon={closeOutline} />
                  </button>
                  <button className="care-btn small" onClick={handleSaveBio} disabled={saving} style={{ margin: 0 }}>
                    {saving ? <IonSpinner name="dots" /> : <IonIcon icon={saveOutline} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <h2 className="patient-title" style={{ fontSize: "1.5rem" }}>Mi Información</h2>
          <p className="patient-subtitle">Datos clínicos y de contacto</p>

          {/* 🏥 DATOS CLÍNICOS */}
          <div className="profile-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 className="section-title" style={{ margin: 0 }}>Detalles de Salud</h3>
              <button
                onClick={() => setEditingClinical(!editingClinical)}
                style={{ background: 'var(--primary-gradient)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}
              >
                {editingClinical ? "Cancelar" : "Editar"}
              </button>
            </div>

            {editingClinical ? (
              <div className="info-card fade-in" style={{ padding: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', display: 'block', marginBottom: '5px' }}>EDAD</label>
                  <input
                    type="number"
                    value={tempAge}
                    onChange={(e) => setTempAge(e.target.value)}
                    placeholder="Ej: 75"
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', display: 'block', marginBottom: '5px' }}>GÉNERO</label>
                  <select
                    value={tempGender}
                    onChange={(e) => setTempGender(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', display: 'block', marginBottom: '5px' }}>CONDICIÓN / DIAGNÓSTICO</label>
                  <textarea
                    value={tempCondition}
                    onChange={(e) => setTempCondition(e.target.value)}
                    placeholder="Ej: Hipertensión, Diabetes..."
                    rows={2}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                  />
                </div>

                <button
                  className="patient-btn"
                  onClick={handleSaveClinical}
                  disabled={saving}
                  style={{ margin: 0, padding: '12px' }}
                >
                  {saving ? <IonSpinner name="dots" /> : "Guardar Cambios"}
                </button>
              </div>
            ) : (
              <div className="info-card">
                <div className="info-row">
                  <div className="info-icon"><IonIcon icon={calendar} /></div>
                  <div className="info-content">
                    <div className="info-label">Edad Estimada</div>
                    <div className="info-value">{patientData?.age ? `${patientData.age} años` : "No definida"}</div>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-icon"><IonIcon icon={transgender} /></div>
                  <div className="info-content">
                    <div className="info-label">Género</div>
                    <div className="info-value">{patientData?.gender || user?.gender || "No definido"}</div>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-icon"><IonIcon icon={medkit} /></div>
                  <div className="info-content">
                    <div className="info-label">Condición Diagnosticada</div>
                    <div className="info-value">{patientData?.condition || "Sin diagnóstico registrado"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 👨‍⚕️ INFORMACIÓN DEL CUIDADOR */}
          {patientData?.caregiver && (
            <div className="profile-section">
              <h3 className="section-title">Mi Cuidador</h3>
              <div className="caregiver-card">
                <div className="caregiver-header">
                  <div className="caregiver-avatar">
                    {patientData.caregiver.photoUrl ? (
                      <img src={patientData.caregiver.photoUrl} alt={patientData.caregiver.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {patientData.caregiver.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="caregiver-info">
                    <div className="caregiver-name">{patientData.caregiver.name}</div>
                    <div className="caregiver-role">Responsable Médico</div>
                  </div>
                </div>

                {patientData.caregiver.bio && (
                  <div className="caregiver-bio">
                    "{patientData.caregiver.bio}"
                  </div>
                )}

                <div className="caregiver-details-grid">
                  <div className="detail-item">
                    <IonIcon icon={mail} />
                    <div className="detail-text">
                      <span className="detail-lbl">Email Profesional</span>
                      <span className="detail-val">{patientData.caregiver.email}</span>
                    </div>
                  </div>
                </div>

                <button className="whatsapp-btn-pro" onClick={handleWhatsapp}>
                  <IonIcon icon={call} /> Contactar Cuidador
                </button>
              </div>
            </div>
          )}

          <button
            className="patient-btn"
            style={{
              background: "linear-gradient(135deg, #e53935, #c62828)",
              marginTop: "40px",
              boxShadow: "0 10px 20px rgba(229, 57, 53, 0.2)"
            }}
            onClick={handleLogout}
          >
            Cerrar Sesión Segura
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PatientProfile;
