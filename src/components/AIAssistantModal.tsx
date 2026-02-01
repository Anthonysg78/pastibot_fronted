import React, { useState, useRef, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { close, send } from 'ionicons/icons';
import { sendChatMessage, ChatMessage } from '../api/groqApi';
import './AIAssistantModal.css';

interface AIAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: inputMessage.trim(),
        };

        // Agregar mensaje del usuario a la UI
        setMessages((prev) => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            // Enviar mensaje al backend
            const response = await sendChatMessage(userMessage.content, messages);

            if (response.success && response.response) {
                const assistantMessage: ChatMessage = {
                    role: 'assistant',
                    content: response.response,
                };
                setMessages((prev) => [...prev, assistantMessage]);
            } else {
                // Mensaje de error
                const errorMessage: ChatMessage = {
                    role: 'assistant',
                    content: response.error || 'Lo siento, hubo un error al procesar tu mensaje.',
                };
                setMessages((prev) => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'Lo siento, no pude conectarme con el asistente. Por favor, intenta de nuevo.',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleModalClose = () => {
        onClose();
    };

    return (
        <IonModal isOpen={isOpen} onDidDismiss={handleModalClose} className="ai-assistant-modal">
            <IonHeader>
                <IonToolbar className="ai-modal-toolbar">
                    <IonTitle className="ai-modal-title">
                        <span className="ai-icon">🧠</span> Asistente IA
                    </IonTitle>
                    <IonButton slot="end" fill="clear" onClick={handleModalClose}>
                        <IonIcon icon={close} />
                    </IonButton>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ai-modal-content">
                <div className="messages-container">
                    {messages.length === 0 && (
                        <div className="welcome-message">
                            <h3>👋 ¡Hola! Soy tu asistente de salud</h3>
                            <p>Puedo ayudarte con información sobre medicamentos, cuidados médicos y bienestar general.</p>
                            <p className="hint">¿En qué puedo ayudarte hoy?</p>
                        </div>
                    )}

                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                        >
                            <div className="message-content">
                                <p>{msg.content}</p>
                                {msg.role === 'user' && <span className="message-icon">👤</span>}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="message assistant-message">
                            <div className="message-content">
                                <span className="message-icon">🤖</span>
                                <div className="typing-indicator">
                                    <IonSpinner name="dots" />
                                    <span>Escribiendo...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </IonContent>

            <div className="ai-input-container">
                <textarea
                    className="ai-input"
                    placeholder="Escribe tu pregunta aquí..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={1}
                    disabled={isLoading}
                />

                <button
                    className="ai-send-button"
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                >
                    <IonIcon icon={send} />
                </button>
            </div>
        </IonModal>
    );
};

export default AIAssistantModal;
