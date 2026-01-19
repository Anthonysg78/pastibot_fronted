import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent } from "@ionic/react";
import "./Splash.css";

const Splash: React.FC = () => {
  const history = useHistory();
  useEffect(() => {
    const t = setTimeout(() => history.push("/welcome"), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <IonPage>
      <IonContent fullscreen className="splash-screen">
        <img src="/logo3d.png" alt="Pastibot Logo" className="logo" />
      </IonContent>
    </IonPage>
  );
};

export default Splash;
