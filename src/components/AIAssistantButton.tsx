import React, { useState } from 'react';
import './AIAssistantButton.css';
import AIAssistantModal from './AIAssistantModal';

const AIAssistantButton: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleClick = () => {
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <button
                className="ai-assistant-button"
                onClick={handleClick}
                aria-label="Abrir asistente de IA"
            >
                {/* Brain Icon SVG */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M12 2C10.8954 2 10 2.89543 10 4C10 4.55228 9.55228 5 9 5C7.89543 5 7 5.89543 7 7C7 7.55228 6.55228 8 6 8C4.89543 8 4 8.89543 4 10C4 11.1046 4.89543 12 6 12C6.55228 12 7 12.4477 7 13C7 14.1046 7.89543 15 9 15C9.55228 15 10 15.4477 10 16C10 17.1046 10.8954 18 12 18C13.1046 18 14 17.1046 14 16C14 15.4477 14.4477 15 15 15C16.1046 15 17 14.1046 17 13C17 12.4477 17.4477 12 18 12C19.1046 12 20 11.1046 20 10C20 8.89543 19.1046 8 18 8C17.4477 8 17 7.55228 17 7C17 5.89543 16.1046 5 15 5C14.4477 5 14 4.55228 14 4C14 2.89543 13.1046 2 12 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9.5 10C9.5 10 10 10.5 10.5 11"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M14.5 10C14.5 10 14 10.5 13.5 11"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M12 13C12 13 11 14 10 14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M12 13C12 13 13 14 14 14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </button>

            <AIAssistantModal isOpen={isModalOpen} onClose={handleClose} />
        </>
    );
};

export default AIAssistantButton;
