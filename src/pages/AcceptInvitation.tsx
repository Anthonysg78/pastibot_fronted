import { IonPage, IonContent } from "@ionic/react";
import { useHistory, useParams } from "react-router";
import { api } from "../api/axios";
import { useEffect } from "react";

const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const history = useHistory();

  useEffect(() => {
    const acceptInvitation = async () => {
      try {
        await api.post(`/invitations/accept/${token}`);

        // ✅ invitación aceptada → paciente
        history.replace("/patient/home");
      } catch (err: any) {

        if (err.response?.status === 401) {
          history.replace(`/login?redirect=/accept-invitation/${token}`);
        } else {
          alert("Invitación inválida o expirada");
          history.replace("/login");
        }
      }
    };

    acceptInvitation();
  }, [token, history]);

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h2>Vinculando paciente...</h2>
        <p>Un momento por favor</p>
      </IonContent>
    </IonPage>
  );
};

export default AcceptInvitation;
