import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent } from "@ionic/react";
import { api, setAuthToken } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getRedirectPath } from "../utils/routing";

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
    setAuthToken(token);

    // Esperar a que getProfile() actualice el contexto
    getProfile().then(() => {
      // Pequeño delay para asegurar que el contexto se actualizó
      setTimeout(() => {
        // Obtener el usuario actualizado del localStorage o hacer una llamada directa
        api.get("/auth/profile")
          .then((res) => {
            const user = res.data;
            console.log("SocialSuccess - Usuario cargado:", user);

            // 🔥 LOGIC PRO: Usar helper centralizado
            const nextPath = getRedirectPath(user);
            console.log("SocialSuccess - Redirigiendo a:", nextPath);

            // Si nos dice ir a selectrole pero teníamos un pendingRole, ajustamos
            if (nextPath === '/selectrole') {
              const pendingRole = localStorage.getItem("pendingRole");
              if (pendingRole) {
                localStorage.removeItem("pendingRole");
                history.replace(`/selectrole?role=${pendingRole}`);
                return;
              }
            }

            history.replace(nextPath);
          })
          .catch((err) => {
            console.error("SocialSuccess - Error al obtener perfil:", err);
            history.replace("/login");
          });
      }, 300); // Pequeño delay para que el contexto se actualice
    }).catch((err) => {
      console.error("SocialSuccess - Error en getProfile:", err);
      history.replace("/login");
    });
  }, [history, getProfile]);

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
