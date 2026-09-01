import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonIcon,
  IonPage,
} from '@ionic/react';
import {
  arrowBackOutline,
  notificationsOutline,
  refreshOutline,
  checkmarkOutline,
  warningOutline,
  timeOutline,
  alertCircleOutline,
} from 'ionicons/icons';

import { api, Alert } from '../services/api';
import './Assets.css';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filterType, setFilterType] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      setLoading(true);
      const data = await api.alerts.getActive();
      setAlerts(data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(alertId: number) {
    try {
      await api.alerts.resolve(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      alert('Alert marked as resolved.');
    } catch (err: any) {
      alert(`Failed to resolve alert: ${err.message}`);
    }
  }

  async function handleTriggerScan() {
    try {
      setScanning(true);
      const res = await api.alerts.triggerScan();
      alert(`Audit scan complete! Created ${res.alerts_created} new alert(s).`);
      await loadAlerts();
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  }

  const filtered = alerts.filter((a) => {
    if (filterType === 'All') return true;
    return a.type === filterType;
  });

  const overdueCount = alerts.filter((a) => a.type === 'OVERDUE').length;
  const expiryCount = alerts.filter((a) => a.type === 'EXPIRING_SOON').length;
  const anomalyCount = alerts.filter((a) => a.type.includes('ANOMALY')).length;

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
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>/ Alerts Center</span>
          </div>

          <header className="assets-header">
            <div>
              <div className="assets-title-row">
                <IonIcon icon={notificationsOutline} />
                <h1>Alerts Center</h1>
              </div>
              <p>Proactive notifications for overdue equipment, impending expirations, and usage anomalies.</p>
            </div>

            <button
              onClick={handleTriggerScan}
              disabled={scanning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFCD11',
                color: '#000',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <IonIcon icon={refreshOutline} />
              {scanning ? 'Scanning fleet...' : 'Run Audit Scan Now'}
            </button>
          </header>

          {/* METRIC CARDS */}
          <section className="asset-summary" style={{ marginTop: '20px' }}>
            <div className="asset-summary-card">
              <span>Total Active Alerts</span>
              <strong>{alerts.length}</strong>
              <small>Requiring review</small>
            </div>

            <div className="asset-summary-card">
              <span>Overdue Rentals</span>
              <strong style={{ color: overdueCount > 0 ? '#ef4444' : '#10b981' }}>{overdueCount}</strong>
              <small>Past expected return date</small>
            </div>

            <div className="asset-summary-card">
              <span>Expiring Soon</span>
              <strong style={{ color: expiryCount > 0 ? '#f59e0b' : '#10b981' }}>{expiryCount}</strong>
              <small>Due within 48 hours</small>
            </div>

            <div className="asset-summary-card">
              <span>Telemetry Anomalies</span>
              <strong style={{ color: anomalyCount > 0 ? '#ec4899' : '#10b981' }}>{anomalyCount}</strong>
              <small>High idle or abnormal hours</small>
            </div>
          </section>

          {/* FILTER TOOLBAR */}
          <section className="asset-toolbar" style={{ marginTop: '20px' }}>
            <div className="asset-filter">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="All">All Alert Types ({alerts.length})</option>
                <option value="OVERDUE">Overdue Rentals</option>
                <option value="EXPIRING_SOON">Expiring Soon</option>
                <option value="ANOMALY_IDLE">Idle Ratio Anomalies</option>
                <option value="ANOMALY_HOURS">Operating Hours Anomalies</option>
                <option value="MAINTENANCE_DUE">Maintenance Due</option>
              </select>
            </div>
          </section>

          {/* ALERT LIST */}
          <section className="asset-table-card" style={{ marginTop: '16px' }}>
            <div className="asset-table-header">
              <div>
                <h2>Active Incidents & Alerts</h2>
                <p>Click "Resolve" after inspecting the asset or contacting the client.</p>
              </div>
              <span>{filtered.length} active</span>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map((alertItem) => (
                <div
                  key={alertItem.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#27272a',
                    padding: '16px',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${
                      alertItem.severity === 'CRITICAL' || alertItem.severity === 'HIGH'
                        ? '#ef4444'
                        : alertItem.severity === 'MEDIUM'
                        ? '#f59e0b'
                        : '#3b82f6'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: alertItem.type === 'OVERDUE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: alertItem.type === 'OVERDUE' ? '#ef4444' : '#f59e0b',
                        fontSize: '1.4rem',
                      }}
                    >
                      <IonIcon icon={alertItem.type === 'OVERDUE' ? alertCircleOutline : warningOutline} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#fff', fontSize: '1rem' }}>{alertItem.equipment_id}</strong>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#3f3f46',
                            color: '#e4e4e7',
                            fontWeight: 600,
                          }}
                        >
                          {alertItem.type}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: alertItem.severity === 'HIGH' ? '#ef4444' : '#f59e0b',
                            fontWeight: 700,
                          }}
                        >
                          [{alertItem.severity}]
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', color: '#cbd5e1', fontSize: '0.9rem' }}>{alertItem.message}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolve(alertItem.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      border: '1px solid #10b981',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <IonIcon icon={checkmarkOutline} />
                    Resolve
                  </button>
                </div>
              ))}

              {filtered.length === 0 && !loading && (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  No active alerts found for this filter.
                </div>
              )}
            </div>
          </section>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Alerts;
