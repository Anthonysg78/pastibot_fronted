import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent } from "@ionic/react";
import { api, setAuthToken } from "../api/axios";
import { useAuth } from "../context/AuthContext";

const SocialSuccess: React.FC = () => {
  const history = useHistory();
  const { getProfile } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      history.replace("/login");
      return;
    }

    // Guardamos token y actualizamos API
    localStorage.setItem("token", token);
    setAuthToken(token); // 👈 Usar helper para consistencia

    // Forzar recarga del perfil para que PatientHome detecte la falta de vinculación
    getProfile().then(() => {
      // 1️⃣ Consultar perfil del usuario desde el backend
      api.get("/auth/profile")
        .then((res) => {
          const user = res.data;

          console.log("USUARIO LOGUEADO SOCIAL:", user);

          // a. Si ES CUIDADOR -> directo a su panel
          if (user.role === "CUIDADOR") {
            history.replace("/care/home");
            return;
          }

          // b. Si ES PACIENTE -> directo a su home (allí le pedirá el código si no tiene perfil)
          if (user.role === "PACIENTE") {
            history.replace("/patient/home");
            return;
          }

          // c. Si no tiene rol aún (raro en registro pero posible en social login)
          if (!user.role) {
            history.replace("/selectrole");
            return;
          }
        })
        .catch(() => {
          history.replace("/login");
        });
    });
  }, [history]);

  return (
    <IonPage>
      <IonContent fullscreen className="light-bg">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <p>Procesando inicio de sesión...</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SocialSuccess;
