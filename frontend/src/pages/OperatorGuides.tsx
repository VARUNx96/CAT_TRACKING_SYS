import React, { useState } from 'react';
import {
  IonContent,
  IonIcon,
  IonPage,
} from '@ionic/react';
import {
  arrowBackOutline,
  schoolOutline,
  qrCodeOutline,
  constructOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

import { api } from '../services/api';
import TopNavbar from '../components/TopNavbar';
import './Assets.css';

const OperatorGuides: React.FC = () => {
  const [testId, setTestId] = useState('CAT-320-01');
  const [testQR, setTestQR] = useState<{ token: string; image: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerateTestQR() {
    try {
      setLoading(true);
      const token = `DEMO-SCAN-${testId}-${Date.now().toString().slice(-4)}`;
      const qrData = await api.rentals.getQRCode(token);
      setTestQR({ token: qrData.qr_token, image: qrData.qr_image_base64 });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <IonPage>
      <IonContent fullscreen className="assets-page">
        <div className="assets-container">

          {/* TOP NAV BAR */}
          <TopNavbar currentTitle="Operator Guides & SOPs" activePath="/operator-guides" />

          <header className="assets-header">
            <div>
              <div className="assets-title-row">
                <IonIcon icon={schoolOutline} />
                <h1>Operator Guides & Standard Operating Procedures</h1>
              </div>
              <p>Standardized workflows for equipment checkout, QR-based return verification, and daily telemetry reporting.</p>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginTop: '24px' }}>

            {/* SOP 1: CHECKOUT */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#FFCD11', fontSize: '1.2rem', fontWeight: 700 }}>
                Step 1: Check-Out & Dispatch
              </h3>
              <ol style={{ paddingLeft: '20px', color: '#cbd5e1', lineHeight: '1.8', margin: 0 }}>
                <li>Select machine from <strong>Rentals → Dispatch</strong>.</li>
                <li>Enter the client name, site location, and expected return date.</li>
                <li>Submit the form to generate the encrypted <strong>QR Token</strong>.</li>
                <li>Print or send the QR code to the site manager or equipment operator.</li>
              </ol>
            </div>

            {/* SOP 2: RETURN */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#10b981', fontSize: '1.2rem', fontWeight: 700 }}>
                Step 2: Check-In & Machine Return
              </h3>
              <ol style={{ paddingLeft: '20px', color: '#cbd5e1', lineHeight: '1.8', margin: 0 }}>
                <li>When the machine returns, scan the QR code token at the depot gate.</li>
                <li>If the QR code is lost, enter the <strong>Equipment ID</strong> manually.</li>
                <li>Verify return date and click <strong>Verify Return</strong>.</li>
                <li>The asset immediately transitions from <code>Rented</code> to <code>Available</code>.</li>
              </ol>
            </div>

            {/* SOP 3: TELEMETRY & IDLE TIME */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#3b82f6', fontSize: '1.2rem', fontWeight: 700 }}>
                Step 3: Telemetry & Anomaly Prevention
              </h3>
              <ul style={{ paddingLeft: '20px', color: '#cbd5e1', lineHeight: '1.8', margin: 0 }}>
                <li>Log daily engine hours and idle hours in <strong>Usage & Telemetry</strong>.</li>
                <li>Idle ratios exceeding <strong>60%</strong> trigger automatic AI anomaly alerts.</li>
                <li>Machines operating without an assigned operator ID trigger compliance notices.</li>
              </ul>
            </div>

            {/* QR TEST STATION */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <IonIcon icon={qrCodeOutline} style={{ color: '#FFCD11', fontSize: '1.4rem' }} />
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>
                  Interactive QR Token Simulator
                </h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 12px 0' }}>
                Test QR code generation for scanning drills without modifying database state.
              </p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={testId}
                  onChange={(e) => setTestId(e.target.value)}
                  placeholder="Asset ID"
                  style={{ flex: 1, padding: '10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                />
                <button
                  onClick={handleGenerateTestQR}
                  disabled={loading}
                  style={{
                    padding: '10px 16px',
                    background: '#FFCD11',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#000',
                  }}
                >
                  Generate QR
                </button>
              </div>

              {testQR && (
                <div style={{ textAlign: 'center', padding: '12px', background: '#27272a', borderRadius: '12px' }}>
                  <img
                    src={`data:image/png;base64,${testQR.image}`}
                    alt="Demo QR"
                    style={{ width: '160px', height: '160px', borderRadius: '8px', background: '#fff', padding: '6px' }}
                  />
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '8px 0 0 0' }}>
                    Token: <code>{testQR.token}</code>
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default OperatorGuides;
