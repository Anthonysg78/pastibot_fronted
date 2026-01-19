import React, { useState, useEffect } from "react";
import { IonContent, IonSpinner, IonPage, IonIcon, IonModal } from "@ionic/react";
import {
  medkit, flask, water, bandage, thermometer, nutrition, beaker, leaf,
  chevronForwardOutline, chevronBackOutline, closeOutline, timeOutline,
  checkmarkCircle, alertCircle
} from "ionicons/icons";
import { api } from "../../api/axios";
import "./PatientPage.css";

const G_ICONS: any = { medkit, flask, water, bandage, thermometer, nutrition, beaker, leaf };

interface Medicine {
  id: number;
  name: string;
  dosage: string;
  time: string;
  days: string[];
  stock: number | null;
  label: string | null;
  icon?: string;
  instructions?: string;
  category?: string;
  imageUrls?: string[];
  reminders?: Array<{ id: number; time: string }>;
}

const PatientMedicines: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [galleryMed, setGalleryMed] = useState<Medicine | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    api.get("/my/medicines")
      .then(res => setMedicines(res.data))
      .catch(err => console.error("Error cargando medicinas:", err))
      .finally(() => setLoading(false));
  }, []);

  // Actualizar reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getIconById = (id: string) => {
    return G_ICONS[id] || medkit;
  };

  const getNextDose = (med: Medicine) => {
    const now = new Date();
    const times = med.reminders && med.reminders.length > 0
      ? med.reminders.map(r => r.time)
      : [med.time];

    // Encontrar la próxima hora
    for (const time of times.sort()) {
      const [hours, minutes] = time.split(':').map(Number);
      const doseTime = new Date();
      doseTime.setHours(hours, minutes, 0, 0);

      if (doseTime > now) {
        return doseTime;
      }
    }

    // Si no hay más hoy, la primera de mañana
    const [hours, minutes] = times[0].split(':').map(Number);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);
    return tomorrow;
  };

  const getTimeUntil = (targetTime: Date) => {
    const diff = targetTime.getTime() - currentTime.getTime();
    if (diff < 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, total: diff };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent fullscreen className="patient-page">
          <div className="patient-container center-flex">
            <IonSpinner name="crescent" />
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
          <h1 className="patient-title">Mis Medicinas</h1>
          <p className="patient-subtitle">Tus tratamientos activos</p>

          {/* Reloj Digital */}
          <div className="digital-clock">
            <div className="clock-time">
              {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="clock-date">
              {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>

          {medicines.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <IonIcon icon={medkit} style={{ fontSize: '5rem', color: 'var(--muted)', marginBottom: '20px' }} />
              <h3 style={{ color: 'var(--muted)' }}>No tienes medicinas asignadas</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Tu cuidador aún no ha configurado tus medicamentos</p>
            </div>
          ) : (
            <div className="medicines-grid-enhanced">
              {medicines.map(med => {
                const nextDose = getNextDose(med);
                const timeUntil = getTimeUntil(nextDose);
                const isUrgent = timeUntil.total < 3600000; // Menos de 1 hora

                return (
                  <div className={`medicine-card-enhanced ${isUrgent ? 'urgent' : ''}`} key={med.id}>
                    {/* Header con imagen */}
                    <div
                      className="medicine-header-enhanced"
                      onClick={() => {
                        if (med.imageUrls && med.imageUrls.length > 0) {
                          setGalleryMed(med);
                          setGalleryIdx(0);
                        }
                      }}
                    >
                      {med.imageUrls && med.imageUrls.length > 0 ? (
                        <>
                          <img src={med.imageUrls[0]} alt={med.name} className="medicine-bg-image" />
                          <div className="medicine-overlay"></div>
                          {med.imageUrls.length > 1 && (
                            <div className="image-count-badge-enhanced">
                              +{med.imageUrls.length - 1} fotos
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="medicine-icon-bg">
                          <IonIcon icon={getIconById(med.icon || 'medkit')} />
                        </div>
                      )}

                      <div className="medicine-header-content">
                        <h3 className="medicine-name-enhanced">{med.name}</h3>
                        <p className="medicine-dosage-enhanced">{med.dosage}</p>
                        {med.category && (
                          <span className="category-badge-enhanced">{med.category}</span>
                        )}
                      </div>
                    </div>

                    {/* Contador de Tiempo */}
                    <div className={`countdown-section ${isUrgent ? 'urgent-countdown' : ''}`}>
                      <div className="countdown-label">
                        <IonIcon icon={timeOutline} />
                        <span>{isToday(nextDose) ? 'Próxima dosis en' : 'Mañana a las'}</span>
                      </div>

                      {isToday(nextDose) ? (
                        <div className="countdown-timer">
                          <div className="time-unit">
                            <div className="time-value">{String(timeUntil.hours).padStart(2, '0')}</div>
                            <div className="time-label">horas</div>
                          </div>
                          <div className="time-separator">:</div>
                          <div className="time-unit">
                            <div className="time-value">{String(timeUntil.minutes).padStart(2, '0')}</div>
                            <div className="time-label">min</div>
                          </div>
                          <div className="time-separator">:</div>
                          <div className="time-unit">
                            <div className="time-value">{String(timeUntil.seconds).padStart(2, '0')}</div>
                            <div className="time-label">seg</div>
                          </div>
                        </div>
                      ) : (
                        <div className="next-day-time">
                          {nextDose.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}

                      {isUrgent && (
                        <div className="urgent-badge">
                          <IonIcon icon={alertCircle} />
                          <span>¡Próxima dosis pronto!</span>
                        </div>
                      )}
                    </div>

                    {/* Horarios del día */}
                    <div className="daily-schedule">
                      <div className="schedule-title">📅 Horarios de hoy</div>
                      <div className="schedule-times-grid">
                        {(med.reminders && med.reminders.length > 0
                          ? med.reminders.map(r => r.time)
                          : [med.time]
                        ).map((time, idx) => {
                          const [hours, minutes] = time.split(':').map(Number);
                          const scheduleTime = new Date();
                          scheduleTime.setHours(hours, minutes, 0, 0);
                          const isPast = scheduleTime < currentTime;

                          return (
                            <div key={idx} className={`schedule-time-chip ${isPast ? 'past' : 'upcoming'}`}>
                              <IonIcon icon={isPast ? checkmarkCircle : timeOutline} />
                              <span>{time}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Días de la semana */}
                    {med.days && med.days.length > 0 && (
                      <div className="week-days-visual">
                        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(day => (
                          <div
                            key={day}
                            className={`day-indicator ${med.days.includes(day) ? 'active' : 'inactive'}`}
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Instrucciones */}
                    {med.instructions && (
                      <div className="instructions-box-enhanced">
                        <div className="instructions-icon-enhanced">💡</div>
                        <div className="instructions-text-enhanced">{med.instructions}</div>
                      </div>
                    )}

                    {/* Stock */}
                    {med.stock !== null && (
                      <div className="stock-indicator">
                        <div className="stock-bar-container">
                          <div
                            className={`stock-bar ${med.stock < 5 ? 'low' : med.stock < 10 ? 'medium' : 'good'}`}
                            style={{ width: `${Math.min((med.stock / 30) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="stock-text">
                          <span>📦 Stock: {med.stock} dosis</span>
                          {med.stock < 5 && <span className="stock-warning">⚠️ Bajo</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* GALERÍA DE IMÁGENES */}
        {galleryMed && (
          <IonModal
            isOpen={true}
            onDidDismiss={() => setGalleryMed(null)}
            className="image-gallery-modal"
          >
            <div className="gallery-container">
              <button
                className="gallery-close-btn"
                onClick={() => setGalleryMed(null)}
              >
                <IonIcon icon={closeOutline} />
              </button>

              <div className="gallery-content">
                <img
                  src={galleryMed.imageUrls![galleryIdx]}
                  alt={galleryMed.name}
                  className="gallery-image"
                />

                {galleryMed.imageUrls!.length > 1 && (
                  <>
                    <button
                      className="gallery-nav-btn prev"
                      onClick={() => setGalleryIdx(Math.max(0, galleryIdx - 1))}
                      disabled={galleryIdx === 0}
                    >
                      <IonIcon icon={chevronBackOutline} />
                    </button>
                    <button
                      className="gallery-nav-btn next"
                      onClick={() => setGalleryIdx(Math.min(galleryMed.imageUrls!.length - 1, galleryIdx + 1))}
                      disabled={galleryIdx === galleryMed.imageUrls!.length - 1}
                    >
                      <IonIcon icon={chevronForwardOutline} />
                    </button>
                  </>
                )}
              </div>

              <div className="gallery-info">
                <h3>{galleryMed.name}</h3>
                <p>{galleryMed.dosage}</p>
                <div className="gallery-counter">
                  {galleryIdx + 1} / {galleryMed.imageUrls!.length}
                </div>
              </div>
            </div>
          </IonModal>
        )}
      </IonContent>
    </IonPage>
  );
};

export default PatientMedicines;
