import React, { useState, useEffect, useRef } from "react";
import { IonContent, IonPage, IonIcon, IonSpinner } from "@ionic/react";
import {
  call, mail, calendar,
  transgender, cameraOutline, refreshOutline,
  saveOutline, closeOutline, pencilOutline, logOutOutline,
  medkit
} from "ionicons/icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/axios";
import StatusModal from "../../components/StatusModal";
import PhotoUploadModal from "../../components/PhotoUploadModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
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
    phone?: string;
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
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

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

  const handleSourceSelect = async (source: 'camera' | 'gallery') => {
    setIsPhotoModalOpen(false);
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos
      });

      if (image.base64String) {
        setUploading(true);
        const base64 = `data:image/${image.format};base64,${image.base64String}`;
        try {
          await api.patch("/users/profile", { photoUrl: base64 });
          if (getProfile) getProfile();
          showStatus('success', '¡Foto Actualizada!', 'Tu foto de perfil se ha actualizado con éxito.');
        } catch (err) {
          console.error("Error subiendo foto:", err);
          showStatus('error', 'Error', 'No se pudo actualizar la foto.');
        } finally {
          setUploading(false);
        }
      }
    } catch (err) {
      console.error("Error with Camera:", err);
    }
  };

  const handleSaveBio = async () => {
    setSaving(true);
    try {
      await api.patch("/users/profile", { bio: tempBio });
      if (getProfile) getProfile();
      setEditing(false);
      showStatus('success', '¡Perfil Actualizado!', 'Tu biografía ha sido guardada.');
    } catch (err) {
      console.error("Error guardando bio:", err);
      showStatus('error', 'Error', 'No se pudo guardar la biografía.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClinical = async () => {
    if (!patientData) return;
    setSaving(true);
    try {
      await api.patch(`/patients/update-my-profile`, {
        age: tempAge ? Number(tempAge) : null,
        condition: tempCondition,
        gender: tempGender
      });
      await loadPatientData();
      if (getProfile) getProfile();
      setEditingClinical(false);
      showStatus('success', '¡Éxito!', 'Perfil clínico actualizado correctamente.');
    } catch (err) {
      console.error("Error guardando datos clínicos:", err);
      showStatus('error', 'Error', 'No se pudieron guardar los datos clínicos.');
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsapp = () => {
    if (patientData?.caregiver) {
      if (!patientData.caregiver.phone) {
        showStatus('warning', 'Sin Teléfono', 'Tu cuidador aún no ha registrado su número de WhatsApp.');
        return;
      }
      let cleanPhone = patientData.caregiver.phone.replace(/\D/g, '');
      if (!cleanPhone.startsWith('593')) {
        cleanPhone = '593' + (cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone);
      }
      const message = encodeURIComponent(`Hola ${patientData.caregiver.name}, soy ${user?.name} 👋. Necesito ayuda.`);
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent fullscreen className="patient-page">
          <div className="center-flex" style={{ height: "100%", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen className="patient-page">
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
              <div className={`edit-photo-badge ${uploading ? 'uploading' : ''}`} onClick={() => setIsPhotoModalOpen(true)}>
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

                <button className="patient-btn" onClick={handleSaveClinical} disabled={saving} style={{ margin: 0, padding: '12px' }}>
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

          {patientData?.caregiver ? (
            <div className="profile-section">
              <h3 className="section-title">Mi Cuidador</h3>
              <div className="caregiver-card">
                <div className="caregiver-header">
                  <div className="caregiver-avatar">
                    {patientData.caregiver.photoUrl ? (
                      <img src={patientData.caregiver.photoUrl} alt={patientData.caregiver.name} />
                    ) : (
                      <div className="avatar-placeholder">{patientData.caregiver.name.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div className="caregiver-info">
                    <div className="caregiver-name">{patientData.caregiver.name}</div>
                    <div className="caregiver-role">Responsable Médico</div>
                  </div>
                </div>
                <button className="whatsapp-btn-pro" onClick={handleWhatsapp}>
                  <IonIcon icon={call} /> Contactar Cuidador
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-section">
              <h3 className="section-title">Mi Cuidador</h3>
              <div className="caregiver-card" style={{ textAlign: 'center', padding: '30px 20px' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '25px' }}>
                  Ingresa el código que te proporcionó tu cuidador para vincular tu cuenta.
                </p>
                <div className="cp-input-group" style={{ marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="CÓDIGO (EJ: ABCD12)"
                    className="cp-input"
                    id="linkActionCode"
                    style={{ textAlign: 'center', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: '800', width: '100%', fontSize: '1.1rem', border: '1px solid #e0e0e0', background: '#fff', padding: '12px', borderRadius: '12px' }}
                  />
                </div>
                <button className="patient-btn" style={{ margin: 0 }} onClick={async () => {
                  const input = document.getElementById('linkActionCode') as HTMLInputElement;
                  const code = input.value.trim().toUpperCase();
                  if (!code) return showStatus('warning', 'Código vacío', 'Ingresa el código por favor.');
                  setSaving(true);
                  try {
                    await api.post("/patients/link", { code });
                    showStatus('success', '¡Conectado!', 'Te has vinculado exitosamente.');
                    setTimeout(() => { window.location.reload(); }, 1500);
                  } catch (err: any) {
                    try {
                      await api.patch("/patients/update-my-profile", { caregiverCode: code });
                      showStatus('success', '¡Conectado!', 'Perfil actualizado con tu cuidador.');
                      setTimeout(() => { window.location.reload(); }, 1500);
                    } catch (retryErr: any) {
                      const msg = retryErr?.response?.data?.message || err?.response?.data?.message || "Código inválido.";
                      showStatus('error', 'Error', msg);
                    }
                  } finally {
                    setSaving(false);
                  }
                }}>
                  {saving ? <IonSpinner name="dots" /> : "Vincular Cuenta"}
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '40px', paddingBottom: '30px', display: 'flex', justifyContent: 'center' }}>
            <button
              className="patient-btn danger shadow-premium"
              style={{ background: "linear-gradient(135deg, #FF5252, #D32F2F)", width: '90%', maxWidth: '400px', borderRadius: '16px', color: 'white', fontWeight: 700, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <IonIcon icon={logOutOutline} /> Cerrar Sesión Segura
            </button>
          </div>
        </div>

        <PhotoUploadModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          onSelect={handleSourceSelect}
        />
        <ConfirmationModal
          isOpen={isLogoutModalOpen}
          type="warning"
          title="Cerrar Sesión"
          message="¿Estás seguro que deseas cerrar sesión de forma segura?"
          confirmText="Cerrar Sesión"
          cancelText="Cancelar"
          onConfirm={() => {
            setIsLogoutModalOpen(false);
            logout();
          }}
          onCancel={() => setIsLogoutModalOpen(false)}
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

export default PatientProfile;
