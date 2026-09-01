import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { useState, useEffect } from 'react';
import {
  homeOutline,
  constructOutline,
  analyticsOutline,
  notificationsOutline,
  settingsOutline,
  moonOutline,
  sunnyOutline,
  swapHorizontalOutline,
  speedometerOutline,
  schoolOutline,
} from 'ionicons/icons';

import {
  api,
  DashboardSummary,
  EquipmentDashboardRow,
  Alert,
  ForecastResponse,
  AnomalyResult,
} from '../services/api';

import './Home.css';

const Home: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary>({
    total_equipment: 0,
    rented: 0,
    available: 0,
    maintenance: 0,
    flagged: 0,
    active_alerts: 0,
    expiring_soon: 0,
    overdue: 0,
  });
  const [equipment, setEquipment] = useState<EquipmentDashboardRow[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [sumRes, fleetRes, alertRes, forecastRes, anomalyRes] = await Promise.allSettled([
          api.dashboard.getSummary(),
          api.assets.getFleet(),
          api.alerts.getActive(),
          api.ai.getDemandForecast('Excavator'),
          api.ai.getRecentAnomalies(),
        ]);

        if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
        if (fleetRes.status === 'fulfilled') setEquipment(fleetRes.value);
        if (alertRes.status === 'fulfilled') setAlerts(alertRes.value);
        if (forecastRes.status === 'fulfilled') setForecast(forecastRes.value);
        if (anomalyRes.status === 'fulfilled') setAnomalies(anomalyRes.value);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const stats = [
    {
      label: 'Total Equipment',
      value: summary.total_equipment.toString(),
      detail: 'Fleet size',
      icon: '▦',
    },
    {
      label: 'Rented',
      value: summary.rented.toString(),
      detail: 'Currently with clients',
      icon: '↗',
    },
    {
      label: 'Available',
      value: summary.available.toString(),
      detail: 'Ready for deployment',
      icon: '✓',
    },
    {
      label: 'Maintenance',
      value: summary.maintenance.toString(),
      detail: 'Under maintenance',
      icon: '⚙',
    },
  ];

  return (
    <IonPage className={darkMode ? 'dark-mode' : ''}>
      <IonContent fullscreen className="home-page">
        <div className="home-layout">

          {/* SIDEBAR */}
          <aside className="sidebar">

            <div className="home-logo">
              <img
                src="/images/full-light.jpg"
                alt="Caterpillar"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <h2 style={{ color: '#FFCD11', margin: '8px 0 0 0', fontWeight: 800 }}>CAT TRACK</h2>
            </div>

            <nav className="menu">
              <a className="menu-item active" href="/home">
                <IonIcon icon={homeOutline} />
                <span>Dashboard</span>
              </a>

              <a className="menu-item" href="/assets">
                <IonIcon icon={constructOutline} />
                <span>Assets</span>
              </a>

              <a className="menu-item" href="/rentals">
                <IonIcon icon={swapHorizontalOutline} />
                <span>Rentals</span>
              </a>

              <a className="menu-item" href="/usage">
                <IonIcon icon={speedometerOutline} />
                <span>Usage & Telemetry</span>
              </a>

              <a className="menu-item" href="/alerts">
                <IonIcon icon={notificationsOutline} />
                <span>Alerts</span>
              </a>

              <a className="menu-item" href="/insights">
                <IonIcon icon={analyticsOutline} />
                <span>AI Insights</span>
              </a>

              <a className="menu-item" href="/operator-guides">
                <IonIcon icon={schoolOutline} />
                <span>Operator Guides</span>
              </a>
            </nav>

            <div className="sidebar-bottom">
              <a className="menu-item" href="/settings">
                <IonIcon icon={settingsOutline} />
                <span>Settings</span>
              </a>

              <button
                className="theme-button"
                onClick={() => setDarkMode(!darkMode)}
              >
                <IonIcon
                  icon={darkMode ? sunnyOutline : moonOutline}
                />
                <span>
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>
            </div>

          </aside>

          {/* MAIN CONTENT */}
          <main className="main-content">

            {/* TOP BAR */}
            <header className="topbar">
              <div>
                <h2>Dashboard</h2>
                <p>Rental intelligence overview</p>
              </div>

              <div className="profile">
                <div className="profile-avatar">V</div>
                <div>
                  <strong>Varun</strong>
                  <small>Administrator</small>
                </div>
              </div>
            </header>

            {/* DASHBOARD BODY */}
            <section className="dashboard">

              {/* WELCOME */}
              <div className="welcome">
                <div>
                  <h1>Good morning 👋</h1>
                  <p>
                    Here's what's happening across your rental fleet.
                  </p>
                </div>

                <div className="system-status">
                  <span style={{ color: loading ? '#f59e0b' : '#10b981' }}>●</span>
                  {loading ? ' Syncing telemetry...' : ' Intelligence layer active'}
                </div>
              </div>

              {/* STATS */}
              <div className="stats-grid">
                {stats.map((stat) => (
                  <div className="stat-card" key={stat.label}>
                    <div className="stat-top">
                      <span>{stat.label}</span>
                      <b>{stat.icon}</b>
                    </div>
                    <strong>{stat.value}</strong>
                    <small>{stat.detail}</small>
                  </div>
                ))}
              </div>

              {/* AI + ATTENTION */}
              <div className="content-grid">

                {/* AI INSIGHTS */}
                <div className="panel ai-panel">
                  <div className="panel-header">
                    <div>
                      <h3>AI Insights & Recommendations</h3>
                      <p>From asset data to operational decisions</p>
                    </div>
                    <span className="ai-badge">AI</span>
                  </div>

                  <div className="insight">
                    <div className="insight-icon forecast">↗</div>
                    <div className="insight-content">
                      <strong>
                        {forecast ? `Demand Forecast: ${forecast.equipment_type}` : 'Excavator Demand Model Active'}
                      </strong>
                      <span>
                        {forecast?.recommendation || 'AI projection suggests rising machine-hour demand next week.'}
                      </span>
                      <button onClick={() => { window.location.href = '/insights'; }}>
                        Review allocation →
                      </button>
                    </div>
                  </div>

                  <div className="insight">
                    <div className="insight-icon anomaly">!</div>
                    <div className="insight-content">
                      <strong>
                        {anomalies.length > 0
                          ? `Anomaly Flagged: ${anomalies[0].equipment_id}`
                          : 'Telemetry Anomaly Detector'}
                      </strong>
                      <span>
                        {anomalies.length > 0
                          ? `Reasons: ${anomalies[0].reason_codes.join(', ')} (Score: ${anomalies[0].anomaly_score.toFixed(2)})`
                          : 'All operating hours and idle ratios are within nominal thresholds.'}
                      </span>
                      <button onClick={() => { window.location.href = '/alerts'; }}>
                        Inspect alerts →
                      </button>
                    </div>
                  </div>
                </div>

                {/* ATTENTION */}
                <div className="panel attention-panel">
                  <div className="panel-header">
                    <div>
                      <h3>Attention Required</h3>
                      <p>Items that may need action</p>
                    </div>
                    <a href="/alerts">View all</a>
                  </div>

                  <div className="attention-list">
                    <div className="attention-item danger">
                      <span>!</span>
                      <div>
                        <strong>{summary.expiring_soon} rentals expiring</strong>
                        <small>Within the next 48 hours</small>
                      </div>
                    </div>

                    <div className="attention-item warning">
                      <span>!</span>
                      <div>
                        <strong>{summary.overdue} overdue assets</strong>
                        <small>Return confirmation required</small>
                      </div>
                    </div>

                    <div className="attention-item neutral">
                      <span>i</span>
                      <div>
                        <strong>{summary.maintenance} assets in maintenance</strong>
                        <small>Check service schedules</small>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* FLEET + ACTIVITY */}
              <div className="content-grid">

                {/* FLEET STATUS */}
                <div className="panel equipment-panel">
                  <div className="panel-header">
                    <div>
                      <h3>Fleet Status</h3>
                      <p>Track every asset from handoff to return</p>
                    </div>
                    <a href="/assets">View all</a>
                  </div>

                  <div className="equipment-list">
                    {equipment.slice(0, 5).map((item) => (
                      <div className="equipment" key={item.id}>
                        <div className="equipment-icon">🚜</div>

                        <div className="equipment-info">
                          <strong>{item.name}</strong>
                          <span>{item.id} · {item.location}</span>
                        </div>

                        <div className="equipment-client">
                          <small>Client</small>
                          <span>{item.client}</span>
                        </div>

                        <div className={`status ${item.status.toLowerCase()}`}>
                          ● {item.status}
                        </div>

                        <div className="usage">
                          <small>Utilization</small>
                          <span>{item.utilization_pct_7d ? `${item.utilization_pct_7d}%` : '—'}</span>
                        </div>
                      </div>
                    ))}
                    {equipment.length === 0 && !loading && (
                      <p style={{ color: '#94a3b8', padding: '16px 0' }}>No equipment records found.</p>
                    )}
                  </div>
                </div>

                {/* RECENT ACTIVITY */}
                <div className="panel activity-panel">
                  <div className="panel-header">
                    <div>
                      <h3>Recent Alerts & Events</h3>
                      <p>Latest asset telemetry events</p>
                    </div>
                    <a href="/alerts">Alert Center</a>
                  </div>

                  <div className="activity-list">
                    {alerts.slice(0, 4).map((alert) => (
                      <div className="activity" key={alert.id}>
                        <span className={`activity-dot ${alert.severity.toLowerCase() === 'high' ? 'alert' : 'checkout'}`} />
                        <div>
                          <strong>{alert.equipment_id} · {alert.type}</strong>
                          <small>{alert.message}</small>
                        </div>
                      </div>
                    ))}

                    {alerts.length === 0 && (
                      <div className="activity">
                        <span className="activity-dot return" />
                        <div>
                          <strong>All systems normal</strong>
                          <small>No active alert conditions</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </section>

          </main>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;