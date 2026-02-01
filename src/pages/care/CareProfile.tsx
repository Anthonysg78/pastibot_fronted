import React, { useState, useEffect } from "react";
import { IonContent, IonIcon, IonAvatar, IonChip, IonPage } from "@ionic/react";
import {
  personCircleOutline,
  mailOutline,
  peopleOutline,
  pulseOutline,
  settingsOutline,
  logOutOutline,
  cameraOutline,
  chevronForwardOutline,
  shieldCheckmarkOutline,
  notificationsOutline
} from "ionicons/icons";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import PhotoUploadModal from "../../components/PhotoUploadModal";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/axios";
import StatusModal from "../../components/StatusModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import "./CarePage.css";
import PhoneInput from 'react-phone-input-2';

const CareProfile: React.FC = () => {
  const { user, logout, getProfile } = useAuth();
  const [photo, setPhoto] = useState(user?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Anthony");
  const [bio, setBio] = useState(user?.bio || "Dedicado al cuidado y bienestar de mis pacientes. Siempre buscando la mejor tecnología para ayudar.");
  const [editing, setEditing] = useState(false);
  const [tempBio, setTempBio] = useState(user?.bio || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [tempPhone, setTempPhone] = useState(user?.phone || "");
  const [gender, setGender] = useState(user?.gender || "No definido");
  const [uploading, setUploading] = useState(false);

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

  // 🔄 SINCRONIZAR ESTADO CON EL CONTEXTO
  useEffect(() => {
    if (user) {
      if (user.photoUrl) setPhoto(user.photoUrl);
      if (user.bio) {
        setBio(user.bio);
        setTempBio(user.bio);
      }
      if (user.phone) {
        setPhone(user.phone);
        setTempPhone(user.phone);
      }
      if (user.gender) setGender(user.gender);
    }
  }, [user]);

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
          setPhoto(base64);
          if (getProfile) getProfile();
          showStatus('success', '¡Genial!', 'Tu foto de perfil ha sido actualizada.');
        } catch (err) {
          console.error("Error subiendo foto:", err);
          showStatus('error', 'Error', 'No se pudo subir la foto.');
        } finally {
          setUploading(false);
        }
      }
    } catch (err) {
      console.error("Error with Camera:", err);
    }
  };

  const handleSave = async () => {
    if (tempBio.length > 150) {
      showStatus('warning', 'Validación', 'La biografía no puede exceder 150 caracteres.');
      return;
    }

    try {
      await api.patch("/users/profile", { bio: tempBio, phone: tempPhone });
      setBio(tempBio);
      setPhone(tempPhone);
      setEditing(false);
      if (getProfile) getProfile();
      showStatus('success', '¡Perfil Actualizado!', 'Tus cambios se han guardado correctamente.');
    } catch (err) {
      console.error("Error guardando perfil:", err);
      showStatus('error', 'Error', 'No se pudieron guardar los cambios.');
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="care-page">
        <div className="care-bubble b1" />
        <div className="care-bubble b3" />

        <div className="care-container" style={{ paddingTop: '2vh' }}>
          {!editing ? (
            <>
              {/* HERO SECTION */}
              <div className="profile-hero-card shadow-premium" style={{
                background: 'var(--primary-gradient)',
                borderRadius: '28px',
                padding: '35px 20px',
                textAlign: 'center',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '24px'
              }}>
                <div className="glass-reflection" />

                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '15px' }}>
                  <img
                    src={photo}
                    alt="Perfil"
                    className="profile-avatar-premium"
                    style={{
                      width: '105px',
                      height: '105px',
                      borderRadius: '32px',
                      border: '4px solid rgba(255,255,255,0.3)',
                      boxShadow: '0 12px 25px rgba(0,0,0,0.2)',
                      objectFit: 'cover',
                      opacity: uploading ? 0.5 : 1
                    }}
                  />
                  <div className="edit-avatar-badge" onClick={() => setIsPhotoModalOpen(true)}>
                    <IonIcon icon={uploading ? pulseOutline : cameraOutline} className={uploading ? "bt-active-pulse" : ""} />
                  </div>
                </div>

                <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.9rem', letterSpacing: '-0.5px' }}>
                  {user?.name || "Anthony González"}
                </h2>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.15)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  marginTop: '10px',
                  fontSize: '0.9rem',
                  backdropFilter: 'blur(5px)'
                }}>
                  <IonIcon icon={mailOutline} style={{ marginRight: '6px' }} />
                  {user?.email || "anthony@pastibot.com"}
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <IonChip style={{ background: 'white', color: 'var(--primary)', fontWeight: 700, margin: 0 }}>
                    <IonIcon icon={shieldCheckmarkOutline} style={{ color: 'var(--primary)' }} /> Cuidador Pro
                  </IonChip>
                </div>
              </div>

              {/* STATS ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="care-card shadow-premium" style={{ margin: 0, padding: '20px 15px', borderRadius: '24px', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(2, 136, 209, 0.1)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <IonIcon icon={peopleOutline} style={{ fontSize: '1.3rem', color: 'var(--primary)' }} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>5</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Pacientes</p>
                </div>

                <div className="care-card shadow-premium" style={{ margin: 0, padding: '20px 15px', borderRadius: '24px', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(129, 199, 132, 0.1)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <IonIcon icon={pulseOutline} style={{ fontSize: '1.3rem', color: '#4caf50' }} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>100%</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Eficacia</p>
                </div>
              </div>

              {/* SETTINGS LIST */}
              <h4 style={{ paddingLeft: '8px', marginBottom: '12px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Configuración de Cuenta
              </h4>

              <div className="care-card shadow-premium" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
                <div className="action-item" onClick={() => setEditing(true)}>
                  <div className="action-icon" style={{ background: 'rgba(3, 169, 244, 0.1)', color: '#03a9f4' }}>
                    <IonIcon icon={settingsOutline} />
                  </div>
                  <div className="action-label">Editar Perfil</div>
                  <IonIcon icon={chevronForwardOutline} className="action-arrow" />
                </div>

                <div className="action-item" onClick={() => showStatus('info', 'Notificaciones', 'Las notificaciones se configuran desde los ajustes del sistema.')}>
                  <div className="action-icon" style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}>
                    <IonIcon icon={notificationsOutline} />
                  </div>
                  <div className="action-label">Alertas y Sonidos</div>
                  <IonIcon icon={chevronForwardOutline} className="action-arrow" />
                </div>

                <div className="action-item" onClick={() => setIsLogoutModalOpen(true)}>
                  <div className="action-icon" style={{ background: 'rgba(229, 57, 53, 0.1)', color: '#e53935' }}>
                    <IonIcon icon={logOutOutline} />
                  </div>
                  <div className="action-label" style={{ color: '#e53935' }}>Cerrar Sesión Segura</div>
                  <IonIcon icon={chevronForwardOutline} className="action-arrow" />
                </div>
              </div>

              {/* BIO BRIEF */}
              <div style={{ marginTop: '24px', textAlign: 'center', padding: '0 20px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic', lineHeight: '1.4' }}>
                  "{bio}"
                </p>
              </div>
            </>
          ) : (
            <div className="edit-profile-card shadow-premium" style={{ borderRadius: '28px' }}>
              <h2 className="care-title" style={{ textAlign: 'center', marginBottom: '30px' }}>Editar Perfil</h2>

              <div className="edit-photo" style={{ marginBottom: '30px' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={photo}
                    alt="Avatar"
                    className="profile-avatar-premium"
                    style={{ width: '90px', height: '90px', borderRadius: '28px', border: '3px solid var(--primary)' }}
                  />
                </div>
                <button className="care-btn small" onClick={() => setIsPhotoModalOpen(true)} style={{ marginTop: '15px', maxWidth: '180px' }}>
                  Cambiar Imagen
                </button>
              </div>

              <div className="edit-form">
                <label className="input-label">Biografía Profesional</label>
                <textarea
                  className="care-textarea"
                  placeholder="Cuéntanos un poco sobre ti..."
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  maxLength={150}
                  style={{
                    width: '100%',
                    height: '110px',
                    borderRadius: '16px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    padding: '14px',
                    background: '#f8fafc',
                    marginBottom: '20px',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    color: 'var(--text)'
                  }}
                />

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="input-label">Número de WhatsApp</label>
                  <PhoneInput
                    country={'ec'}
                    value={tempPhone}
                    onChange={(phone: string) => setTempPhone('+' + phone)}
                    inputStyle={{
                      width: '100%',
                      height: '50px',
                      borderRadius: '16px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: '#f8fafc',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                    containerStyle={{
                      width: '100%',
                      marginBottom: '20px'
                    }}
                    buttonStyle={{
                      border: 'none',
                      background: 'transparent',
                      paddingLeft: '5px'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">Género (No editable)</label>
                  <div
                    className="select-wrapper-premium"
                    style={{
                      background: '#f1f5f9',
                      padding: '14px',
                      borderRadius: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(0,0,0,0.05)',
                      cursor: 'default',
                      opacity: 0.7
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{gender}</span>
                    <IonIcon icon={shieldCheckmarkOutline} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                  </div>
                </div>
              </div>

              <div className="edit-actions" style={{ marginTop: '40px', display: 'flex', gap: '12px' }}>
                <button className="care-btn outline" onClick={() => setEditing(false)} style={{ margin: 0 }}>Volver</button>
                <button className="care-btn" onClick={handleSave} style={{ margin: 0 }}>Guardar</button>
              </div>
            </div>
          )}
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

export default CareProfile;
