import React from 'react';
import { IonModal, IonIcon } from '@ionic/react';
import { alertCircleOutline, trashOutline, helpCircleOutline } from 'ionicons/icons';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    type: 'danger' | 'warning' | 'info';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    type,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    onConfirm,
    onCancel
}) => {
    const getIcon = () => {
        switch (type) {
            case 'danger': return trashOutline;
            case 'warning': return alertCircleOutline;
            case 'info': return helpCircleOutline;
            default: return helpCircleOutline;
        }
    };

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onCancel} className={`confirm-modal ${type}-modal`}>
            <div className="confirm-modal-content">
                <div className={`confirm-icon-container ${type}`}>
                    <IonIcon icon={getIcon()} />
                </div>
                <h2 className="confirm-title">{title}</h2>
                <div className="confirm-message" dangerouslySetInnerHTML={{ __html: message }} />

                <div className="confirm-actions">
                    <button className="confirm-btn cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={`confirm-btn confirm ${type}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </IonModal>
    );
};

export default ConfirmationModal;
