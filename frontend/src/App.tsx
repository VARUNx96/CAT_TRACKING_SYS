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

const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Routes>
            <Route path="/splash" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/home" element={<Home />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/operator-guides" element={<OperatorGuides />} />
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