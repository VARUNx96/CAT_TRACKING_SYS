import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Routes, Route, Navigate } from 'react-router-dom';

import Splash from './pages/Splash';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Assets from './pages/assets';
import Rentals from './pages/Rentals';
import Usage from './pages/Usage';
import Alerts from './pages/Alerts';
import Insights from './pages/Insights';
import OperatorGuides from './pages/OperatorGuides';
import ForgotPassword from './pages/ForgotPassword';

import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Routes>

            {/* Public Routes */}
            <Route path="/splash" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>

            {/* Protected Routes */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            <Route
              path="/assets"
              element={
                <ProtectedRoute>
                  <Assets />
                </ProtectedRoute>
              }
            />

            <Route
              path="/rentals"
              element={
                <ProtectedRoute>
                  <Rentals />
                </ProtectedRoute>
              }
            />

            <Route
              path="/usage"
              element={
                <ProtectedRoute>
                  <Usage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/insights"
              element={
                <ProtectedRoute>
                  <Insights />
                </ProtectedRoute>
              }
            />

            <Route
              path="/operator-guides"
              element={
                <ProtectedRoute>
                  <OperatorGuides />
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route
              path="/"
              element={<Navigate to="/home" replace />}
            />

          </Routes>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;