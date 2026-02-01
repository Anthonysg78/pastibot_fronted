import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IonSpinner, IonContent, IonPage } from '@ionic/react';

interface ProtectedRouteProps {
    component: React.ComponentType<any>;
    path: string;
    exact?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, ...rest }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <IonPage>
                <IonContent className="ion-text-center ion-justify-content-center ion-align-items-center" style={{ display: 'flex', height: '100vh' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <IonSpinner name="crescent" />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <Route
            {...rest}
            render={(props) => {
                if (!user) {
                    // Si no hay usuario, mandar al login
                    return <Redirect to="/login" />;
                }

                // Si hay usuario, renderizar el componente protegido
                return <Component {...props} />;
            }}
        />
    );
};

export default ProtectedRoute;
