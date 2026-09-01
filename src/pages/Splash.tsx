import { IonContent, IonPage } from '@ionic/react';

import './Splash.css';

const Splash: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen className='splash-page'>
        <div className="splash-container">
            <img
                src="/images/black-yellow.jpg"
                alt="Caterpillar CAT"
                className="splash-logo"
            />
          <button
            className="splash-button"
            onClick={() => {
              window.location.href = '/login';
            }}
          >
            Get Started
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;