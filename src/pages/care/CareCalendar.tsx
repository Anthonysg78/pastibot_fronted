
import React, { useState, useEffect } from "react";
import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonButton,
    IonSpinner
} from "@ionic/react";
import {
    chevronBackOutline,
    chevronForwardOutline,
    calendarOutline,
    checkmarkCircle,
    alertCircleOutline,
    medkit,
    timeOutline
} from "ionicons/icons";
import "./CareCalendar.css";
import { api } from "../../api/axios";

interface CalendarDose {
    id: string;
    time: string;
    medicineName: string;
    dosage: string;
    status: 'TAKEN' | 'PENDING' | 'MISSED';
    icon: string;
    color?: string;
}

const CareCalendar: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);

    // Mock data for demonstration as requested
    const [doses, setDoses] = useState<CalendarDose[]>([
        {
            id: "1",
            time: "08:00",
            medicineName: "Paracetamol",
            dosage: "1 tableta - 500mg",
            status: 'TAKEN',
            icon: "💊"
        },
        {
            id: "2",
            time: "14:00",
            medicineName: "Vitamina C",
            dosage: "1 cápsula",
            status: 'PENDING',
            icon: "🧪"
        },
        {
            id: "3",
            time: "20:00",
            medicineName: "Ibuprofeno",
            dosage: "1 tableta - 400mg",
            status: 'MISSED',
            icon: "🩹"
        }
    ]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    const changeDay = (offset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + offset);
        setSelectedDate(newDate);
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    return (
        <IonPage>
            <IonContent fullscreen className="calendar-page">
                {/* Header Personalizado */}
                <div className="calendar-header">
                    <h1 className="calendar-title">Mi Horario</h1>
                </div>

                {/* Navegación Semanal */}
                <div className="week-nav">
                    <button className="nav-btn" onClick={() => changeDay(-1)}>
                        <IonIcon icon={chevronBackOutline} />
                    </button>

                    <button className="nav-btn today" onClick={goToToday}>
                        Hoy
                    </button>

                    <button className="nav-btn" onClick={() => changeDay(1)}>
                        <IonIcon icon={chevronForwardOutline} />
                    </button>
                </div>

                <div className="current-date-display">
                    {formatDate(selectedDate)}
                </div>

                {/* Lista de tomas */}
                <div className="med-timeline">
                    {loading ? (
                        <div className="empty-state-calendar">
                            <IonSpinner name="crescent" color="primary" />
                            <p>Cargando horario...</p>
                        </div>
                    ) : doses.length === 0 ? (
                        <div className="empty-state-calendar">
                            <IonIcon icon={calendarOutline} />
                            <p>No hay medicamentos programados para este día.</p>
                        </div>
                    ) : (
                        doses.map(dose => (
                            <div
                                key={dose.id}
                                className={`med-card status-${dose.status.toLowerCase()}`}
                            >
                                <div className="med-time-large">
                                    {dose.time}
                                </div>

                                <div className="med-info">
                                    <div className="med-name-large">{dose.medicineName}</div>
                                    <div className="med-dosage">{dose.dosage}</div>
                                </div>

                                <div className="med-icon-wrap">
                                    {dose.icon}
                                </div>

                                {/* Indicadores de Estado */}
                                <div className="status-indicator">
                                    {dose.status === 'TAKEN' && <IonIcon icon={checkmarkCircle} />}
                                    {dose.status === 'MISSED' && <IonIcon icon={alertCircleOutline} />}
                                    {dose.status === 'PENDING' && <IonIcon icon={timeOutline} />}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default CareCalendar;
