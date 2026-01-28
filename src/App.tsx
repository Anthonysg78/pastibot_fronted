import React, { useEffect } from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route } from "react-router-dom";

import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SelectRole from "./pages/SelectRole";
import Welcome from "./pages/Welcome";
import Password from "./pages/password";
import SocialSuccess from "./pages/SocialSuccess";
import CompleteProfile from "./pages/CompleteProfile";

import CareTabs from "./pages/care/CareTabs";
import PatientTabs from "./pages/patient/PatientTabs";

import { AuthProvider } from "./context/AuthContext";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

import "./theme/variables.css";
import "./theme/animations.css";
import CareMedicines from "./pages/care/CareMedicines";

import { App as CapacitorApp } from "@capacitor/app"; // <--- Add this

setupIonicReact();

const App: React.FC = () => {
  // 🔥 MANEJO DE DEEP LINKS (Para volver del Navegador al APK)
  useEffect(() => {
    const handleDeepLink = (data: any) => {
      console.log("Deep link received:", data.url);
      const url = new URL(data.url);

      // Si la URL contiene el token de éxito (ej. com.pastibot.app://social-success?token=...)
      if (url.host === 'social-success' || url.pathname.includes('social-success')) {
        const token = url.searchParams.get('token');
        const firebaseToken = url.searchParams.get('firebaseToken');
        if (token) {
          const redirectURL = `/social-success?token=${token}${firebaseToken ? `&firebaseToken=${firebaseToken}` : ''}`;
          window.location.href = redirectURL;
        }
      }
    };

    CapacitorApp.addListener('appUrlOpen', handleDeepLink);

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <IonRouterOutlet>
            {/* PANTALLAS PÚBLICAS */}
            <Route exact path="/splash">
              <Splash />
            </Route>
            <Route exact path="/login">
              <Login />
            </Route>
            <Route exact path="/register">
              <Register />
            </Route>
            <Route exact path="/forgot">
              <ForgotPassword />
            </Route>
            <Route exact path="/reset-password/:token">
              <ResetPassword />
            </Route>
            <Route exact path="/selectrole">
              <SelectRole />
            </Route>
            <Route exact path="/welcome">
              <Welcome />
            </Route>
            <Route exact path="/social-success">
              <SocialSuccess />
            </Route>

            <Route exact path="/complete-profile">
              <CompleteProfile />
            </Route>

            {/* 🔥 NUEVA RUTA PARA CREAR CONTRASEÑA */}
            <Route exact path="/password">
              <Password />
            </Route>

            {/* PANTALLAS PRIVADAS */}
            <Route path="/care" component={CareTabs} />
            <Route path="/patient" component={PatientTabs} />

            {/* REDIRECCIÓN POR DEFECTO */}
            <Route exact path="/">
              <Redirect to="/splash" />
            </Route>
          </IonRouterOutlet>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
};

export default App;
