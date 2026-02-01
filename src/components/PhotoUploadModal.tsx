import React from 'react';
import { IonModal, IonIcon } from '@ionic/react';
import { cameraOutline, imageOutline, closeOutline } from 'ionicons/icons';
import './PhotoUploadModal.css';

interface PhotoUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (source: 'camera' | 'gallery') => void;
    title?: string;
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    title = "Actualizar Foto de Perfil"
}) => {
    return (
        <IonModal
            isOpen={isOpen}
            onDidDismiss={onClose}
            className="photo-upload-modal"
            onIonModalDidDismiss={onClose}
        >
            <div className="photo-modal-wrapper">
                <div className="photo-modal-header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <IonIcon icon={closeOutline} />
                    </button>
                </div>

                <div className="photo-modal-content">
                    <p>Elige de dónde quieres subir tu nueva foto</p>

                    <div className="option-grid">
                        <button className="option-card camera" onClick={() => onSelect('camera')}>
                            <div className="icon-badge">
                                <IonIcon icon={cameraOutline} />
                            </div>
                            <span>Tomar Foto</span>
                            <small>Usa tu cámara en vivo</small>
                        </button>

                        <button className="option-card gallery" onClick={() => onSelect('gallery')}>
                            <div className="icon-badge">
                                <IonIcon icon={imageOutline} />
                            </div>
                            <span>Galería</span>
                            <small>Elige una foto guardada</small>
                        </button>
                    </div>
                </div>

                <div className="photo-modal-footer">
                    <button className="cancel-footer-btn" onClick={onClose}>
                        Tal vez luego
                    </button>
                </div>
            </div>
        </IonModal>
    );
};

export default PhotoUploadModal;
