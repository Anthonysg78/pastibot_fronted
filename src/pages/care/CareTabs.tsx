import React from "react";
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from "@ionic/react";
import { Route, Redirect } from "react-router-dom";

import { homeOutline, medkitOutline, statsChartOutline, peopleOutline, personCircleOutline, rocketOutline } from "ionicons/icons";


import CareHome from "./CareHome";
import CareMedicines from "./CareMedicines";
import CareControl from "./CareControl";
import CarePatients from "./CarePatients";
import CareProfile from "./CareProfile";
import CareMonitoring from "./CareMonitoring";

import "./CareTabs.css";

const CareTabs: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/care/home" component={CareHome} />
        <Route exact path="/care/medicines/:patientId?" component={CareMedicines} />
        <Route exact path="/care/monitoring" component={CareMonitoring} />
        <Route exact path="/care/control" component={CareControl} />
        <Route exact path="/care/patients" component={CarePatients} />
        <Route exact path="/care/profile" component={CareProfile} />
        <Route exact path="/care">
          <Redirect to="/care/home" />
        </Route>
      </IonRouterOutlet>

      {/* Barra inferior con botón central elevado */}
      <IonTabBar slot="bottom" className="care-tabbar">
        <IonTabButton tab="home" href="/care/home">
          <IonIcon icon={homeOutline} />
          <IonLabel>Inicio</IonLabel>
        </IonTabButton>

        <IonTabButton tab="monitoring" href="/care/monitoring">
          <IonIcon icon={statsChartOutline} />
          <IonLabel>Monitoreo</IonLabel>
        </IonTabButton>

        {/* Botón central*/}
        <IonTabButton tab="control" href="/care/control" className="tab-control">
          <IonIcon icon={rocketOutline} />
          <IonLabel>Control</IonLabel>
        </IonTabButton>


        <IonTabButton tab="patients" href="/care/patients">
          <IonIcon icon={peopleOutline} />
          <IonLabel>Pacientes</IonLabel>
        </IonTabButton>

      </IonTabBar>
    </IonTabs>
  );
};

export default CareTabs;
