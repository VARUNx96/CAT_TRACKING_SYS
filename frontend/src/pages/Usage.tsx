import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonIcon,
  IonPage,
} from '@ionic/react';
import {
  arrowBackOutline,
  speedometerOutline,
  timeOutline,
  alertCircleOutline,
  cloudUploadOutline,
} from 'ionicons/icons';

import { api, EquipmentDashboardRow, UsageLog, UtilizationSummary } from '../services/api';
import './Assets.css';

const Usage: React.FC = () => {
  const [fleet, setFleet] = useState<EquipmentDashboardRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [history, setHistory] = useState<UsageLog[]>([]);
  const [utilization, setUtilization] = useState<UtilizationSummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Form for logging new telemetry
  const [logForm, setLogForm] = useState({
    equipment_id: '',
    log_date: new Date().toISOString().split('T')[0],
    engine_hours_day: 7.5,
    idle_hours_day: 1.5,
    operating_days_cumulative: 20,
    last_operator_id: 'OP101',
  });

  useEffect(() => {
    loadFleet();
  }, []);

  async function loadFleet() {
    try {
      const data = await api.assets.getFleet();
      setFleet(data);
      if (data.length > 0) {
        const urlParams = new URLSearchParams(window.location.search);
        const preselected = urlParams.get('id') || data[0].id;
        setSelectedId(preselected);
        setLogForm((prev) => ({ ...prev, equipment_id: preselected }));
        await loadMachineTelemetry(preselected);
      }
    } catch (err) {
      console.error('Error loading fleet:', err);
    }
  }

  async function loadMachineTelemetry(equipmentId: string) {
    if (!equipmentId) return;
    try {
      setLoading(true);
      const [histData, utilData] = await Promise.allSettled([
        api.telemetry.getHistory(equipmentId, 30),
        api.telemetry.getUtilization(equipmentId, 7),
      ]);
      if (histData.status === 'fulfilled') setHistory(histData.value);
      if (utilData.status === 'fulfilled') setUtilization(utilData.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogUsage(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      await api.telemetry.logUsage(logForm);
      alert(`Usage telemetry logged for ${logForm.equipment_id}! Anomaly detector evaluated.`);
      await loadMachineTelemetry(logForm.equipment_id);
    } catch (err: any) {
      alert(`Failed to log telemetry: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

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
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>/ Telemetry & Machine Hours</span>
          </div>

          <header className="assets-header">
            <div>
              <div className="assets-title-row">
                <IonIcon icon={speedometerOutline} />
                <h1>Usage & Telemetry</h1>
              </div>
              <p>Real-time machine runtime, idle hours ratio, and automated anomaly evaluation.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Select Asset:</label>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setLogForm((prev) => ({ ...prev, equipment_id: e.target.value }));
                  loadMachineTelemetry(e.target.value);
                }}
                style={{
                  padding: '8px 12px',
                  background: '#27272a',
                  color: '#fff',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                }}
              >
                {fleet.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({eq.id})
                  </option>
                ))}
              </select>
            </div>
          </header>

          {/* UTILIZATION CARDS */}
          <section className="asset-summary" style={{ marginTop: '20px' }}>
            <div className="asset-summary-card">
              <span>7-Day Utilization</span>
              <strong>{utilization ? `${utilization.utilization_pct}%` : '—'}</strong>
              <small>Operating vs Available Hours</small>
            </div>

            <div className="asset-summary-card">
              <span>Idle Ratio</span>
              <strong style={{ color: (utilization?.idle_ratio || 0) > 0.5 ? '#f59e0b' : '#10b981' }}>
                {utilization ? `${(utilization.idle_ratio * 100).toFixed(1)}%` : '—'}
              </strong>
              <small>Idle Hours / Total Hours</small>
            </div>

            <div className="asset-summary-card">
              <span>Engine Hours (7d)</span>
              <strong>{utilization ? `${utilization.total_engine_hours} hrs` : '—'}</strong>
              <small>Active runtime</small>
            </div>

            <div className="asset-summary-card">
              <span>Total Idle Hours (7d)</span>
              <strong>{utilization ? `${utilization.total_idle_hours} hrs` : '—'}</strong>
              <small>Machine on but stationary</small>
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginTop: '24px' }}>

            {/* LOG TELEMETRY FORM */}
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
                  <IonIcon icon={cloudUploadOutline} style={{ fontSize: '1.4rem' }} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Log Daily Telemetry</h3>
              </div>

              <form onSubmit={handleLogUsage} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '4px' }}>Equipment ID</label>
                  <input
                    type="text"
                    value={logForm.equipment_id}
                    onChange={(e) => setLogForm({ ...logForm, equipment_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '4px' }}>Log Date</label>
                    <input
                      type="date"
                      value={logForm.log_date}
                      onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '4px' }}>Operator ID</label>
                    <input
                      type="text"
                      value={logForm.last_operator_id}
                      onChange={(e) => setLogForm({ ...logForm, last_operator_id: e.target.value })}
                      style={{ width: '100%', padding: '10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '4px' }}>Engine Hours (0-24)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="24"
                      value={logForm.engine_hours_day}
                      onChange={(e) => setLogForm({ ...logForm, engine_hours_day: parseFloat(e.target.value) || 0 })}
                      required
                      style={{ width: '100%', padding: '10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '4px' }}>Idle Hours (0-24)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="24"
                      value={logForm.idle_hours_day}
                      onChange={(e) => setLogForm({ ...logForm, idle_hours_day: parseFloat(e.target.value) || 0 })}
                      required
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
                  Submit Telemetry & Scan Anomaly
                </button>
              </form>
            </div>

            {/* RECENT TELEMETRY TABLE */}
            <div
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 700 }}>Telemetry Logs for {selectedId}</h3>

              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                <table className="asset-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Engine Hrs</th>
                      <th>Idle Hrs</th>
                      <th>Idle Ratio</th>
                      <th>Operator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td>{h.log_date}</td>
                        <td><strong>{h.engine_hours_day}h</strong></td>
                        <td>{h.idle_hours_day}h</td>
                        <td>
                          <span
                            style={{
                              color: h.idle_ratio > 0.6 ? '#ef4444' : '#10b981',
                              fontWeight: 600,
                            }}
                          >
                            {(h.idle_ratio * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td>{h.last_operator_id || '—'}</td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>
                          No historical telemetry found for this asset.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Usage;
