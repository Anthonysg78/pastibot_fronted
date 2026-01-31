import React, { useState, useRef, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { close, send, volumeMedium, volumeMute, volumeHigh, mic, stopCircle } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { sendChatMessage, ChatMessage, transcribeAudio } from '../api/groqApi';
import './AIAssistantModal.css';

interface AIAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Detener voz al cerrar el modal
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const speak = (text: string) => {
        if (!isVoiceEnabled) return;

        // Cancelar cualquier lectura previa
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES'; // Forzar español
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        speechUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const toggleVoice = () => {
        const newStatus = !isVoiceEnabled;
        setIsVoiceEnabled(newStatus);
        if (!newStatus && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    };

    const startRecording = async () => {
        try {
            console.log('Iniciando grabación...');

            // Feedback vibración
            try {
                await Haptics.impact({ style: ImpactStyle.Medium });
            } catch (e) { /* Ignorar si no está disponible */ }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Determinar el tipo de audio soportado
            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : MediaRecorder.isTypeSupported('audio/mp4')
                    ? 'audio/mp4'
                    : '';

            const options = mimeType ? { mimeType } : {};
            const mediaRecorder = new MediaRecorder(stream, options);

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    console.log('Capturando fragmento de audio:', event.data.size, 'bytes');
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const finalMimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
                await handleVoiceMessage(audioBlob);

                // Detener todos los tracks del stream para liberar el micrófono
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(1000); // Enviar datos cada segundo
            setIsRecording(true);
            console.log('Grabación iniciada correctamente');

            // Cancelar cualquier voz activa de la IA al empezar a grabar
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        } catch (error: any) {
            console.error('Error al acceder al micrófono:', error);
            const errorMsg = error.name === 'NotAllowedError'
                ? 'Permiso denegado. Por favor, desinstala la app y vuelve a instalarla para que te pida el permiso de micrófono de nuevo.'
                : `Error al acceder al micrófono: ${error.message || 'Desconocido'}`;
            alert(errorMsg);
        }
    };

    const stopRecording = async () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            // Feedback vibración al soltar
            try {
                await Haptics.impact({ style: ImpactStyle.Light });
            } catch (e) { /* Ignorar */ }
        }
    };

    const handleVoiceMessage = async (audioBlob: Blob) => {
        setIsLoading(true);
        try {
            // 1. Transcribir audio a texto
            const transcriptionResponse = await transcribeAudio(audioBlob);

            if (transcriptionResponse.success && transcriptionResponse.text) {
                const userText = transcriptionResponse.text;

                // 2. Agregar mensaje del usuario a la UI
                const userMessage: ChatMessage = {
                    role: 'user',
                    content: userText,
                };
                setMessages((prev) => [...prev, userMessage]);

                // 3. Enviar texto a la IA (reutilizamos la lógica de handleSendMessage)
                const aiResponse = await sendChatMessage(userText, messages);

                if (aiResponse.success && aiResponse.response) {
                    const assistantMessage: ChatMessage = {
                        role: 'assistant',
                        content: aiResponse.response,
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                    speak(aiResponse.response);
                }
            } else {
                console.error('Error en transcripción:', transcriptionResponse.error);
                alert('No pudimos entender el audio: ' + (transcriptionResponse.error || 'Intenta hablar más claro.'));
            }
        } catch (error: any) {
            console.error('Error procesando mensaje de voz:', error);
            alert('Error al procesar el audio: ' + (error.message || 'Desconocido'));
        } finally {
            setIsLoading(false);
        }
    };

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
            const response = await sendChatMessage(inputMessage.trim(), messages);

            if (response.success && response.response) {
                const assistantMessage: ChatMessage = {
                    role: 'assistant',
                    content: response.response,
                };
                setMessages((prev) => [...prev, assistantMessage]);

                // Hablar la respuesta automáticamente
                speak(response.response);
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
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        onClose();
    };

    return (
        <IonModal isOpen={isOpen} onDidDismiss={handleModalClose} className="ai-assistant-modal">
            <IonHeader>
                <IonToolbar className="ai-modal-toolbar">
                    <IonTitle className="ai-modal-title">
                        <span className="ai-icon">🧠</span> Asistente IA
                    </IonTitle>
                    <IonButton slot="end" fill="clear" onClick={toggleVoice} className="voice-toggle-button">
                        <IonIcon icon={isVoiceEnabled ? volumeHigh : volumeMute} />
                    </IonButton>
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
                                {msg.role === 'assistant' && (
                                    <button
                                        className="repeat-voice-button"
                                        onClick={() => speak(msg.content)}
                                        title="Repetir lectura"
                                    >
                                        <IonIcon icon={volumeMedium} />
                                    </button>
                                )}
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
                    placeholder={isRecording ? "Escuchando..." : "Escribe tu pregunta aquí..."}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={1}
                    disabled={isLoading || isRecording}
                />

                {inputMessage.trim() ? (
                    <button
                        className="ai-send-button"
                        onClick={handleSendMessage}
                        disabled={isLoading}
                    >
                        <IonIcon icon={send} />
                    </button>
                ) : (
                    <button
                        className={`ai-mic-button ${isRecording ? 'recording' : ''}`}
                        onMouseDown={(e) => { e.preventDefault(); startRecording(); }}
                        onMouseUp={(e) => { e.preventDefault(); stopRecording(); }}
                        onMouseLeave={(e) => { if (isRecording) stopRecording(); }}
                        onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                        onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                        disabled={isLoading}
                    >
                        <IonIcon icon={isRecording ? stopCircle : mic} />
                        {isRecording && <div className="recording-wave"></div>}
                    </button>
                )}
            </div>
        </IonModal>
    );
};

export default AIAssistantModal;
