import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonIcon,
  IonPage,
} from '@ionic/react';
import {
  arrowBackOutline,
  analyticsOutline,
  trendingUpOutline,
  swapHorizontalOutline,
  warningOutline,
  sparklesOutline,
} from 'ionicons/icons';

import {
  api,
  ForecastResponse,
  AnomalyResult,
  Recommendation,
} from '../services/api';
import TopNavbar from '../components/TopNavbar';
import './Assets.css';

const Insights: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('Excavator');
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [reallocations, setReallocations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [selectedType]);

  async function loadInsights() {
    try {
      setLoading(true);
      const [fData, aData, rData] = await Promise.allSettled([
        api.ai.getDemandForecast(selectedType, undefined, 7),
        api.ai.getRecentAnomalies(14),
        api.ai.getReallocations(),
      ]);

      if (fData.status === 'fulfilled') setForecast(fData.value);
      if (aData.status === 'fulfilled') setAnomalies(aData.value);
      if (rData.status === 'fulfilled') setReallocations(rData.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <IonPage>
      <IonContent fullscreen className="assets-page">
        <div className="assets-container">

          {/* TOP NAV BAR */}
          <TopNavbar currentTitle="AI Insights & Forecasting" activePath="/insights" />

          <header className="assets-header">
            <div>
              <div className="assets-title-row">
                <IonIcon icon={analyticsOutline} />
                <h1>AI Insights & Forecasting</h1>
              </div>
              <p>Predictive demand models, smart relocation recommendations, and telemetry anomaly analysis.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Forecast Machine Type:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  padding: '8px 14px',
                  background: '#27272a',
                  color: '#fff',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                }}
              >
                <option value="Excavator">Excavator</option>
                <option value="Bulldozer">Bulldozer</option>
                <option value="Crane">Crane</option>
                <option value="Grader">Grader</option>
                <option value="Loader">Loader</option>
              </select>
            </div>
          </header>

          {/* FORECASTING CARD */}
          {/* FORECAST & STRATEGIC RECOMMENDATION */}
          <div className="cat-card-panel" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IonIcon icon={trendingUpOutline} style={{ color: '#FFCD11', fontSize: '1.6rem' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Demand Forecast: {selectedType}
                  </h3>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    Algorithm: {forecast?.method || 'Exponential Smoothing / Linear Trend'} · Horizon: {forecast?.horizon_periods || 7} periods
                  </small>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255, 205, 17, 0.15)',
                  color: '#FFCD11',
                  border: '1px solid rgba(255, 205, 17, 0.35)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                AI Recommendation Active
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-surface-muted)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid #FFCD11',
                marginBottom: '20px',
              }}
            >
              <strong style={{ color: '#FFCD11', display: 'block', marginBottom: '4px' }}>Strategic Recommendation:</strong>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                {forecast?.recommendation || 'Analyzing historical utilization data to formulate pre-positioning recommendation.'}
              </p>
            </div>

            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Projected Demand Points</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {forecast?.points.map((pt, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-surface-muted)',
                    padding: '12px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <small style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{pt.period}</small>
                  <strong style={{ fontSize: '1.25rem', color: '#FFCD11' }}>{pt.predicted_demand.toFixed(1)}h</strong>
                  <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    [{pt.confidence_low.toFixed(0)} - {pt.confidence_high.toFixed(0)}h]
                  </small>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginTop: '24px' }}>

            {/* RESOURCE ALLOCATION CANDIDATES */}
            <div className="cat-card-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <IonIcon icon={swapHorizontalOutline} style={{ color: '#3b82f6', fontSize: '1.4rem' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Fleet Reallocation Candidates</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reallocations.map((rec, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-surface-muted)',
                      border: '1px solid var(--border-color)',
                      padding: '14px',
                      borderRadius: '10px',
                      borderLeft: '4px solid #3b82f6',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{rec.equipment_id}</strong>
                      <span style={{ fontSize: '0.8rem', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                        Reallocate
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{rec.message}</p>
                  </div>
                ))}
                {reallocations.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>All assets currently balanced across sites.</p>
                )}
              </div>
            </div>

            {/* ANOMALY INVESTIGATION */}
            <div className="cat-card-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <IonIcon icon={warningOutline} style={{ color: '#ef4444', fontSize: '1.4rem' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Telemetry Anomalies (Isolation Forest)</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {anomalies.map((anom, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-surface-muted)',
                      border: '1px solid var(--border-color)',
                      padding: '14px',
                      borderRadius: '10px',
                      borderLeft: '4px solid #ef4444',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{anom.equipment_id}</strong>
                      <small style={{ color: '#f87171' }}>Score: {anom.anomaly_score.toFixed(2)}</small>
                    </div>
                    <p style={{ margin: '6px 0 2px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Detected: {anom.reason_codes.join(', ')}
                    </p>
                    <small style={{ color: 'var(--text-muted)' }}>Logged on {anom.log_date} · Confidence: {(anom.confidence * 100).toFixed(0)}%</small>
                  </div>
                ))}
                {anomalies.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No telemetry anomalies flagged in recent 14 days.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Insights;
