import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { useState, useEffect } from 'react';
import {
  homeOutline,
  constructOutline,
  analyticsOutline,
  notificationsOutline,
  moonOutline,
  sunnyOutline,
  swapHorizontalOutline,
  speedometerOutline,
  schoolOutline,
  logOutOutline,
  personCircleOutline,
} from 'ionicons/icons';

import {
  api,
  DashboardSummary,
  EquipmentDashboardRow,
  Alert,
  ForecastResponse,
  AnomalyResult,
} from '../services/api';
import { getInitialTheme, toggleTheme, Theme } from '../utils/theme';
import { getUserProfile, UserProfile, performLogout } from '../utils/userProfile';
import { ProfileModal } from '../components/ProfileModal';

import './Home.css';

const DASHBOARD_CACHE_KEY = 'cat_dashboard_cache';

function getCachedData<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed[key] !== undefined ? parsed[key] : fallback;
  } catch {
    return fallback;
  }
}

function updateDashboardCache(key: string, value: any) {
  try {
    const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[key] = value;
    sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

const Home: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Instantly hydrated from cache for 0ms initial render
  const [summary, setSummary] = useState<DashboardSummary>(() =>
    getCachedData<DashboardSummary>('summary', {
      total_equipment: 0,
      rented: 0,
      available: 0,
      maintenance: 0,
      flagged: 0,
      active_alerts: 0,
      expiring_soon: 0,
      overdue: 0,
    })
  );
  const [equipment, setEquipment] = useState<EquipmentDashboardRow[]>(() =>
    getCachedData<EquipmentDashboardRow[]>('equipment', [])
  );
  const [alerts, setAlerts] = useState<Alert[]>(() =>
    getCachedData<Alert[]>('alerts', [])
  );
  const [forecast, setForecast] = useState<ForecastResponse | null>(() =>
    getCachedData<ForecastResponse | null>('forecast', null)
  );
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>(() =>
    getCachedData<AnomalyResult[]>('anomalies', [])
  );
  const [loading, setLoading] = useState<boolean>(equipment.length === 0);

  useEffect(() => {
    // Progressive fast streaming: update each piece of UI as soon as it arrives
    api.dashboard.getSummary()
      .then((res) => {
        setSummary(res);
        updateDashboardCache('summary', res);
      })
      .catch((err) => console.error('Summary load error:', err));

    api.assets.getFleet()
      .then((res) => {
        setEquipment(res);
        updateDashboardCache('equipment', res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fleet load error:', err);
        setLoading(false);
      });

    api.alerts.getActive()
      .then((res) => {
        setAlerts(res);
        updateDashboardCache('alerts', res);
      })
      .catch((err) => console.error('Alerts load error:', err));

    api.ai.getDemandForecast('Excavator')
      .then((res) => {
        setForecast(res);
        updateDashboardCache('forecast', res);
      })
      .catch((err) => console.error('Forecast load error:', err));

    api.ai.getRecentAnomalies()
      .then((res) => {
        setAnomalies(res);
        updateDashboardCache('anomalies', res);
      })
      .catch((err) => console.error('Anomalies load error:', err));

    function handleThemeChange(e: any) {
      if (e.detail?.theme) setTheme(e.detail.theme);
    }
    function handleProfileChange(e: any) {
      if (e.detail) setProfile(e.detail);
    }

    window.addEventListener('cat-theme-changed', handleThemeChange);
    window.addEventListener('cat-user-profile-changed', handleProfileChange);
    return () => {
      window.removeEventListener('cat-theme-changed', handleThemeChange);
      window.removeEventListener('cat-user-profile-changed', handleProfileChange);
    };
  }, []);

  const stats = [
    {
      label: 'TOTAL ASSETS',
      value: summary.total_equipment.toString(),
      detail: 'Registered Heavy Machinery',
      icon: '▦',
    },
    {
      label: 'RENTED // ACTIVE',
      value: summary.rented.toString(),
      detail: 'Dispatched to Client Sites',
      icon: '↗',
    },
    {
      label: 'AVAILABLE // READY',
      value: summary.available.toString(),
      detail: 'Depot Ready for Deployment',
      icon: '✓',
    },
    {
      label: 'MAINTENANCE // AUDIT',
      value: summary.maintenance.toString(),
      detail: 'Scheduled Service Interval',
      icon: '⚙',
    },
  ];

  return (
    <IonPage className={theme === 'dark' ? 'dark-mode' : ''}>
      <IonContent fullscreen className="home-page">
        <div className="home-layout">

          {/* CATERPILLAR INDUSTRIAL SIDEBAR */}
          <aside className="sidebar">

            <div className="sidebar-brand-box">
              <div className="brand-badge">CAT // TELEMATICS</div>
              <div className="home-logo">
                <img
                  src="/images/full-light.jpg"
                  alt="Caterpillar"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <h2 className="cat-brand-title">CAT TRACK</h2>
                <span className="cat-brand-subtitle">FLEET INTELLIGENCE // AWS DYNAMODB</span>
              </div>
            </div>

            <nav className="menu">
              <a className="menu-item active" href="/home">
                <IonIcon icon={homeOutline} />
                <span>Dashboard</span>
              </a>

              <a className="menu-item" href="/assets">
                <IonIcon icon={constructOutline} />
                <span>Assets Registry</span>
              </a>

              <a className="menu-item" href="/rentals">
                <IonIcon icon={swapHorizontalOutline} />
                <span>Rentals & QR</span>
              </a>

              <a className="menu-item" href="/usage">
                <IonIcon icon={speedometerOutline} />
                <span>Usage & Telemetry</span>
              </a>

              <a className="menu-item" href="/alerts">
                <IonIcon icon={notificationsOutline} />
                <span>Alerts Center</span>
                {summary.active_alerts > 0 && (
                  <span className="sidebar-alert-badge">{summary.active_alerts}</span>
                )}
              </a>

              <a className="menu-item" href="/insights">
                <IonIcon icon={analyticsOutline} />
                <span>AI Insights</span>
              </a>

              <a className="menu-item" href="/operator-guides">
                <IonIcon icon={schoolOutline} />
                <span>Operator SOPs</span>
              </a>
            </nav>

            <div className="sidebar-bottom">
              {/* THEME BUTTON */}
              <button
                className="theme-button"
                onClick={() => {
                  const next = toggleTheme();
                  setTheme(next);
                }}
              >
                <IonIcon
                  icon={theme === 'dark' ? sunnyOutline : moonOutline}
                  style={{ color: '#FFCD11' }}
                />
                <span>
                  {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                </span>
              </button>

              {/* DEDICATED LOGOUT BUTTON IN SIDEBAR */}
              <button
                className="sidebar-logout-button"
                onClick={performLogout}
                title="Sign out of Cat Telematics"
              >
                <IonIcon icon={logOutOutline} />
                <span>Log Out</span>
              </button>
            </div>

          </aside>

          {/* MAIN CONTENT */}
          <main className="main-content">

            {/* TOP BAR */}
            <header className="topbar">
              <div>
                <span className="topbar-tag">FLEET COMMAND // OVERVIEW</span>
                <h2 className="topbar-heading">Executive Telematics Dashboard</h2>
                <p className="topbar-sub">Real-time asset telemetry, predictive intelligence, and rental traceability.</p>
              </div>

              {/* INTERACTIVE PROFILE BUTTON */}
              <div
                className="profile"
                onClick={() => setIsProfileOpen(true)}
                title="Click to view Operator profile and email"
              >
                <div className="profile-avatar">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="profile-text">
                  <strong className="profile-name">{profile.name}</strong>
                  <span className="profile-email">{profile.email}</span>
                </div>
              </div>
            </header>

            {/* DASHBOARD BODY */}
            <section className="dashboard">

              {/* COMMAND HERO BANNER */}
              <div className="welcome">
                <div>
                  <div className="welcome-tag">SYSTEM ONLINE // NODE CAT-US-EAST-1</div>
                  <h1>Good morning, {profile.name.split(' ')[0]} 👋</h1>
                  <p>
                    Continuous machine tracking active. <strong>{summary.total_equipment}</strong> heavy assets monitored via AWS DynamoDB single-table data engine.
                  </p>
                </div>

                <div className="system-status">
                  <span className="status-dot-pulse"></span>
                  {loading ? ' Syncing telemetry records...' : ' Telematics telemetry active'}
                </div>
              </div>

              {/* HIGH-IMPACT STATS GRID */}
              <div className="stats-grid">
                {stats.map((stat) => (
                  <div className="stat-card" key={stat.label}>
                    <div className="stat-top">
                      <span className="stat-label">{stat.label}</span>
                      <b className="stat-icon">{stat.icon}</b>
                    </div>
                    <strong className="stat-value">{stat.value}</strong>
                    <small className="stat-detail">{stat.detail}</small>
                  </div>
                ))}
              </div>

              {/* AI + ATTENTION PANELS */}
              <div className="content-grid">

                {/* AI INSIGHTS */}
                <div className="panel ai-panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-pre-title">PREDICTIVE ANALYTICS</span>
                      <h3>AI Insights & Forecasting</h3>
                      <p>Holt's Linear Smoothing & Isolation Forest anomaly heuristics</p>
                    </div>
                    <span className="ai-badge">AI LIVE</span>
                  </div>

                  <div className="insight">
                    <div className="insight-icon forecast">↗</div>
                    <div className="insight-content">
                      <strong>
                        {forecast ? `Demand Forecast: ${forecast.equipment_type}` : 'Excavator Demand Model Active'}
                      </strong>
                      <span className="insight-desc">
                        {forecast?.recommendation || 'AI projection suggests rising machine-hour demand across active project sites next week.'}
                      </span>
                      <button className="insight-action-btn" onClick={() => { window.location.href = '/insights'; }}>
                        Review Fleet Allocation →
                      </button>
                    </div>
                  </div>

                  <div className="insight">
                    <div className="insight-icon anomaly">!</div>
                    <div className="insight-content">
                      <strong>
                        {anomalies.length > 0
                          ? `Telemetry Anomaly Flagged: ${anomalies[0].equipment_id}`
                          : 'Telemetry Anomaly Detector'}
                      </strong>
                      <span className="insight-desc">
                        {anomalies.length > 0
                          ? `Reasons: ${anomalies[0].reason_codes.join(', ')} (Anomaly Score: ${anomalies[0].anomaly_score.toFixed(2)})`
                          : 'All machine operating hours, fuel idle ratios, and dispatch cycles are operating within nominal thresholds.'}
                      </span>
                      <button className="insight-action-btn" onClick={() => { window.location.href = '/alerts'; }}>
                        Inspect Active Alerts →
                      </button>
                    </div>
                  </div>
                </div>

                {/* ATTENTION REQUIRED */}
                <div className="panel attention-panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-pre-title">AUDIT ENGINE</span>
                      <h3>Attention Required</h3>
                      <p>Compliance and return exceptions requiring operator sign-off</p>
                    </div>
                    <a href="/alerts" className="panel-link">View Alerts Center →</a>
                  </div>

                  <div className="attention-list">
                    <div className="attention-item danger">
                      <span className="attention-icon">!</span>
                      <div>
                        <strong>{summary.expiring_soon} rentals nearing contract expiry</strong>
                        <small>Return confirmation or contract extension required within 48h</small>
                      </div>
                    </div>

                    <div className="attention-item warning">
                      <span className="attention-icon">⚠</span>
                      <div>
                        <strong>{summary.overdue} overdue assets detected</strong>
                        <small>Site dispatch audit flagged missing return timestamp</small>
                      </div>
                    </div>

                    <div className="attention-item neutral">
                      <span className="attention-icon">⚙</span>
                      <div>
                        <strong>{summary.maintenance} machines in maintenance bay</strong>
                        <small>Depot inspection and scheduled hydraulic lubrication</small>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* FLEET + ACTIVITY PANELS */}
              <div className="content-grid">

                {/* FLEET STATUS */}
                <div className="panel equipment-panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-pre-title">TRACEABILITY LEDGER</span>
                      <h3>Fleet Overview</h3>
                      <p>Every asset tracked from handoff to return</p>
                    </div>
                    <a href="/assets" className="panel-link">Open Full Registry →</a>
                  </div>

                  <div className="equipment-list">
                    {equipment.slice(0, 5).map((item) => (
                      <div className="equipment" key={item.id}>
                        <div className="equipment-icon">🚜</div>

                        <div className="equipment-info">
                          <strong>{item.name}</strong>
                          <span>{item.id} · Location: {item.location}</span>
                        </div>

                        <div className="equipment-client">
                          <small>Client Assignment</small>
                          <span>{item.client}</span>
                        </div>

                        <div className={`status ${item.status.toLowerCase()}`}>
                          ● {item.status}
                        </div>

                        <div className="usage">
                          <small>7-Day Utilization</small>
                          <span>{item.utilization_pct_7d !== null ? `${item.utilization_pct_7d}%` : '—'}</span>
                        </div>
                      </div>
                    ))}
                    {equipment.length === 0 && !loading && (
                      <p style={{ color: '#94a3b8', padding: '24px 0', textAlign: 'center' }}>
                        No equipment records found in database.
                      </p>
                    )}
                  </div>
                </div>

                {/* RECENT ACTIVITY */}
                <div className="panel activity-panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-pre-title">INCIDENT LOGS</span>
                      <h3>Telemetry Incidents</h3>
                      <p>Active audit logs generated by background scan</p>
                    </div>
                    <a href="/alerts" className="panel-link">Alerts Center →</a>
                  </div>

                  <div className="activity-list">
                    {alerts.slice(0, 4).map((alert) => (
                      <div className="activity" key={alert.id}>
                        <span className={`activity-dot ${alert.severity.toLowerCase() === 'high' ? 'alert' : 'checkout'}`} />
                        <div className="activity-content">
                          <strong>{alert.equipment_id} // {alert.type}</strong>
                          <p>{alert.message}</p>
                        </div>
                      </div>
                    ))}

                    {alerts.length === 0 && (
                      <div className="activity">
                        <span className="activity-dot return" />
                        <div className="activity-content">
                          <strong>All systems nominal</strong>
                          <p>Zero active telemetry anomalies or contract overruns detected.</p>
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

      {/* OPERATOR PROFILE MODAL */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </IonPage>
  );
};

export default Home;