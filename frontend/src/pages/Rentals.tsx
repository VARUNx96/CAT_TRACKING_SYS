import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonIcon,
  IonPage,
} from '@ionic/react';
import {
  arrowBackOutline,
  swapHorizontalOutline,
  qrCodeOutline,
  logInOutline,
  logOutOutline,
  sparklesOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

import { api, CheckEvent, Recommendation, EquipmentDashboardRow } from '../services/api';
import './Assets.css';

const Rentals: React.FC = () => {
  const [fleet, setFleet] = useState<EquipmentDashboardRow[]>([]);
  const [extensions, setExtensions] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  // Check-out form state
  const [checkoutData, setCheckoutData] = useState({
    equipment_id: '',
    site_id: 'Bangalore',
    operator_id: 'OP101',
    client_name: 'ABC Construction',
    check_out_date: new Date().toISOString().split('T')[0],
    expected_return_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  // Resulting QR token and base64 image
  const [qrResult, setQrResult] = useState<{ token: string; image: string } | null>(null);

  // Check-in form state
  const [checkinData, setCheckinData] = useState({
    qr_token: '',
    equipment_id: '',
    check_in_date: new Date().toISOString().split('T')[0],
  });
  const [checkinSuccess, setCheckinSuccess] = useState<CheckEvent | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [fleetData, extData] = await Promise.allSettled([
        api.assets.getFleet(),
        api.rentals.getExtensionNudges(),
      ]);
      if (fleetData.status === 'fulfilled') setFleet(fleetData.value);
      if (extData.status === 'fulfilled') setExtensions(extData.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const event = await api.rentals.checkOut(checkoutData);
      if (event.qr_token) {
        const qrPayload = await api.rentals.getQRCode(event.qr_token);
        setQrResult({ token: qrPayload.qr_token, image: qrPayload.qr_image_base64 });
      }
      alert(`Equipment ${checkoutData.equipment_id} successfully checked out!`);
      await loadData();
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckin(e: React.FormEvent) {
    e.preventDefault();
    if (!checkinData.qr_token && !checkinData.equipment_id) {
      alert('Provide either QR Token or Equipment ID');
      return;
    }
    try {
      setLoading(true);
      const event = await api.rentals.checkIn({
        qr_token: checkinData.qr_token || undefined,
        equipment_id: checkinData.equipment_id || undefined,
        check_in_date: checkinData.check_in_date,
      });
      setCheckinSuccess(event);
      alert(`Equipment ${event.equipment_id} checked in successfully!`);
      setCheckinData({
        qr_token: '',
        equipment_id: '',
        check_in_date: new Date().toISOString().split('T')[0],
      });
      await loadData();
    } catch (err: any) {
      alert(`Check-in failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const availableEquipment = fleet.filter((e) => e.status === 'Available');

  return (
    <IonPage>
      <IonContent fullscreen className="assets-page">
        <div className="assets-container">

          {/* TOP NAV BAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => { window.location.href = '/home'; }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <IonIcon icon={arrowBackOutline} />
              Dashboard
            </button>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>/ Rentals Management</span>
          </div>

          <header className="assets-header">
            <div>
              <div className="assets-title-row">
                <IonIcon icon={swapHorizontalOutline} />
                <h1>Rentals & Traceability</h1>
              </div>
              <p>Contactless Check-In / Check-Out with automatic QR tokens and contract extensions.</p>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginTop: '20px' }}>

            {/* CHECK-OUT PANEL */}
            <div
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ padding: '8px', background: 'rgba(255, 205, 17, 0.1)', color: '#FFCD11', borderRadius: '8px' }}>
                  <IonIcon icon={logOutOutline} style={{ fontSize: '1.4rem' }} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>1. Dispatch & Check-Out</h3>
              </div>

              <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '4px' }}>Select Available Asset *</label>
                  <select
                    value={checkoutData.equipment_id}
                    onChange={(e) => setCheckoutData({ ...checkoutData, equipment_id: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  >
                    <option value="">-- Choose machine --</option>
                    {availableEquipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.id}) - {eq.type}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '4px' }}>Client Name</label>
                    <input
                      type="text"
                      value={checkoutData.client_name}
                      onChange={(e) => setCheckoutData({ ...checkoutData, client_name: e.target.value })}
                      style={{ width: '100%', padding: '10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '4px' }}>Site ID / Location</label>
                    <input
                      type="text"
                      value={checkoutData.site_id}
                      onChange={(e) => setCheckoutData({ ...checkoutData, site_id: e.target.value })}
                      style={{ width: '100%', padding: '10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '4px' }}>Operator ID</label>
                    <input
                      type="text"
                      value={checkoutData.operator_id}
                      onChange={(e) => setCheckoutData({ ...checkoutData, operator_id: e.target.value })}
                      style={{ width: '100%', padding: '10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '4px' }}>Expected Return Date</label>
                    <input
                      type="date"
                      value={checkoutData.expected_return_date}
                      onChange={(e) => setCheckoutData({ ...checkoutData, expected_return_date: e.target.value })}
                      style={{ width: '100%', padding: '10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: '#FFCD11',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Generate QR Token & Check Out
                </button>
              </form>

              {/* QR DISPLAY */}
              {qrResult && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: '#27272a',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px dashed #FFCD11',
                  }}
                >
                  <IonIcon icon={qrCodeOutline} style={{ fontSize: '1.8rem', color: '#FFCD11' }} />
                  <h4 style={{ margin: '4px 0', color: '#fff' }}>Contactless QR Token</h4>
                  <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: '4px 0 12px 0' }}>
                    Token: <code>{qrResult.token}</code>
                  </p>
                  <img
                    src={`data:image/png;base64,${qrResult.image}`}
                    alt="Check-in QR"
                    style={{ width: '180px', height: '180px', borderRadius: '8px', background: '#fff', padding: '8px' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
                    Print or show this QR to the operator. Scan upon machine return.
                  </p>
                </div>
              )}
            </div>

            {/* CHECK-IN PANEL */}
            <div
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px' }}>
                  <IonIcon icon={logInOutline} style={{ fontSize: '1.4rem' }} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>2. Return & Check-In</h3>
              </div>

              <form onSubmit={handleCheckin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '4px' }}>Scan or Enter QR Token</label>
                  <input
                    type="text"
                    placeholder="e.g. paste generated token"
                    value={checkinData.qr_token}
                    onChange={(e) => setCheckinData({ ...checkinData, qr_token: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                  />
                </div>

                <div style={{ textAlign: 'center', color: '#71717a', fontSize: '0.85rem' }}>— OR —</div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '4px' }}>Equipment ID (Manual Return)</label>
                  <input
                    type="text"
                    placeholder="e.g. CAT-320-01 or EQX2001"
                    value={checkinData.equipment_id}
                    onChange={(e) => setCheckinData({ ...checkinData, equipment_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '4px' }}>Check-In Date</label>
                  <input
                    type="date"
                    value={checkinData.check_in_date}
                    onChange={(e) => setCheckinData({ ...checkinData, check_in_date: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Verify Return & Release Asset
                </button>
              </form>

              {checkinSuccess && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600 }}>
                    <IonIcon icon={checkmarkCircleOutline} /> Return Confirmed
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
                    Asset <strong>{checkinSuccess.equipment_id}</strong> is now marked <strong>Available</strong> for immediate re-dispatch.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* CONTRACT EXTENSION NUDGES */}
          <section className="asset-table-card" style={{ marginTop: '30px' }}>
            <div className="asset-table-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IonIcon icon={sparklesOutline} style={{ color: '#FFCD11', fontSize: '1.4rem' }} />
                <div>
                  <h2>Proactive Rental Extension Nudges</h2>
                  <p>AI identified active rentals nearing expiry with sustained high utilization.</p>
                </div>
              </div>
              <span>{extensions.length} recommendations</span>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {extensions.map((ext, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#27272a',
                    padding: '16px',
                    borderRadius: '10px',
                    borderLeft: '4px solid #FFCD11',
                  }}
                >
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '1rem' }}>{ext.equipment_id}</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#cbd5e1', fontSize: '0.9rem' }}>{ext.message}</p>
                  </div>
                  <span style={{ background: '#FFCD11', color: '#000', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                    Score: {ext.score}
                  </span>
                </div>
              ))}

              {extensions.length === 0 && (
                <p style={{ color: '#94a3b8', margin: 0 }}>No active rental contracts require extension reminders right now.</p>
              )}
            </div>
          </section>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Rentals;
