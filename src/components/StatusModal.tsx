import React from 'react';
import { IonModal, IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, closeCircleOutline, alertCircleOutline } from 'ionicons/icons';
import './StatusModal.css';

interface StatusModalProps {
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onClose: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({ isOpen, type, title, message, onClose }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return checkmarkCircleOutline;
            case 'error': return closeCircleOutline;
            case 'warning': return alertCircleOutline;
            case 'info': return alertCircleOutline;
        }
    };

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose} className={`status-modal ${type}-modal`}>
            <div className="status-modal-content">
                <div className={`status-icon-container ${type}`}>
                    <IonIcon icon={getIcon()} />
                </div>
                <h2 className="status-title">{title}</h2>
                <p className="status-message">{message}</p>
                <button className={`status-btn ${type}`} onClick={onClose}>
                    Entendido
                </button>
            </div>
        </IonModal>
    );
};

export default StatusModal;
