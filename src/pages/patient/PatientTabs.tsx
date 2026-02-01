import React from "react";
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonRouterOutlet,
  IonLabel,
} from "@ionic/react";
import { Route, Redirect } from "react-router-dom";
import { home, medkit, hardwareChipOutline, time, person } from "ionicons/icons";

import PatientHome from "./PatientHome";
import PatientMedicines from "./PatientMedicines";
import PatientRobot from "./PatientRobot";
import PatientHistory from "./PatientHistory";
import PatientProfile from "./PatientProfile";
import AIAssistantButton from "../../components/AIAssistantButton";

const PatientTabs: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/patient/home" component={PatientHome} />
        <Route exact path="/patient/medicines" component={PatientMedicines} />
        <Route exact path="/patient/robot" component={PatientRobot} />
        <Route exact path="/patient/history" component={PatientHistory} />
        <Route exact path="/patient/profile" component={PatientProfile} />
        <Route exact path="/patient">
          <Redirect to="/patient/home" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" style={{
        height: '65px',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        paddingBottom: '5px',
        boxShadow: '0 -5px 20px rgba(0,0,0,0.05)'
      }}>
        <IonTabButton tab="home" href="/patient/home">
          <IonIcon icon={home} />
          <IonLabel>Inicio</IonLabel>
        </IonTabButton>

        <IonTabButton tab="medicines" href="/patient/medicines">
          <IonIcon icon={medkit} />
          <IonLabel>Medicinas</IonLabel>
        </IonTabButton>

        <IonTabButton tab="robot" href="/patient/robot">
          <IonIcon icon={hardwareChipOutline} />
          <IonLabel>Robot</IonLabel>
        </IonTabButton>

        <IonTabButton tab="history" href="/patient/history">
          <IonIcon icon={time} />
          <IonLabel>Historial</IonLabel>
        </IonTabButton>

        <IonTabButton tab="profile" href="/patient/profile">
          <IonIcon icon={person} />
          <IonLabel>Perfil</IonLabel>
        </IonTabButton>
      </IonTabBar>

      {/* AI Assistant Button */}
      <AIAssistantButton />
    </IonTabs>
  );
};

export default PatientTabs;
