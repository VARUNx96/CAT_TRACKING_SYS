import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { supabase } from '../lib/supabase';
import { useState } from 'react';
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

import './Home.css';

console.log('Supabase:', supabase);

const Home: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  const stats = [
    {
      label: 'Total Equipment',
      value: '24',
      detail: 'Fleet size',
      icon: '▦',
    },
    {
      label: 'Rented',
      value: '12',
      detail: 'Currently with clients',
      icon: '↗',
    },
    {
      label: 'Available',
      value: '7',
      detail: 'Ready for deployment',
      icon: '✓',
    },
    {
      label: 'Maintenance',
      value: '3',
      detail: 'Under maintenance',
      icon: '⚙',
    },
  ];

  const equipment = [
    {
      id: 'CAT-320-01',
      name: 'Excavator 320',
      location: 'Bangalore',
      status: 'Rented',
      usage: '82%',
      client: 'ABC Construction',
    },
    {
      id: 'CAT-D6-04',
      name: 'Bulldozer D6',
      location: 'Hyderabad',
      status: 'Available',
      usage: '64%',
      client: '—',
    },
    {
      id: 'CAT-950-02',
      name: 'Loader 950',
      location: 'Chennai',
      status: 'Maintenance',
      usage: '71%',
      client: '—',
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
                src="/public/images/full-dark-removebg-preview.png"
                alt="Caterpillar"
              />
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

              <a className="menu-item" href="#">
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

                <div className="profile-avatar">
                  V
                </div>

                <div>
                  <strong>Varun</strong>
                  <small>Administrator</small>
                </div>

              </div>

            </header>

            {/* DASHBOARD */}
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
                  <span>●</span>
                  Intelligence layer active
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

                    <small>
                      {stat.detail}
                    </small>

                  </div>

                ))}

              </div>

              {/* AI + ATTENTION */}
              <div className="content-grid">

                {/* AI INSIGHTS */}
                <div className="panel ai-panel">

                  <div className="panel-header">

                    <div>
                      <h3>
                        AI Insights & Recommendations
                      </h3>

                      <p>
                        From asset data to operational decisions
                      </p>
                    </div>

                    <span className="ai-badge">
                      AI
                    </span>

                  </div>

                  <div className="insight">

                    <div className="insight-icon forecast">
                      ↗
                    </div>

                    <div className="insight-content">

                      <strong>
                        Demand expected to rise in Bangalore
                      </strong>

                      <span>
                        Forecast indicates 25% higher
                        excavator demand next week.
                      </span>

                      <button>
                        Review allocation →
                      </button>

                    </div>

                  </div>

                  <div className="insight">

                    <div className="insight-icon anomaly">
                      !
                    </div>

                    <div className="insight-content">

                      <strong>
                        Unusual usage detected · CAT-320-01
                      </strong>

                      <span>
                        Usage is 47% above its normal
                        operating pattern.
                      </span>

                      <button>
                        Inspect asset →
                      </button>

                    </div>

                  </div>

                </div>

                {/* ATTENTION */}
                <div className="panel attention-panel">

                  <div className="panel-header">

                    <div>
                      <h3>
                        Attention Required
                      </h3>

                      <p>
                        Items that may need action
                      </p>
                    </div>

                    <a href="#">
                      View all
                    </a>

                  </div>

                  <div className="attention-list">

                    <div className="attention-item danger">

                      <span>!</span>

                      <div>
                        <strong>
                          3 rentals expiring
                        </strong>

                        <small>
                          Within the next 48 hours
                        </small>
                      </div>

                    </div>

                    <div className="attention-item warning">

                      <span>!</span>

                      <div>
                        <strong>
                          7 overdue assets
                        </strong>

                        <small>
                          Return confirmation required
                        </small>
                      </div>

                    </div>

                    <div className="attention-item neutral">

                      <span>i</span>

                      <div>
                        <strong>
                          3 assets in maintenance
                        </strong>

                        <small>
                          Check expected return dates
                        </small>
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
                      <h3>
                        Fleet Status
                      </h3>

                      <p>
                        Track every asset from handoff to return
                      </p>
                    </div>

                    <a href="#">
                      View all
                    </a>

                  </div>

                  <div className="equipment-list">

                    {equipment.map((item) => (

                      <div
                        className="equipment"
                        key={item.id}
                      >

                        <div className="equipment-icon">
                          🚜
                        </div>

                        <div className="equipment-info">

                          <strong>
                            {item.name}
                          </strong>

                          <span>
                            {item.id} · {item.location}
                          </span>

                        </div>

                        <div className="equipment-client">

                          <small>
                            Client
                          </small>

                          <span>
                            {item.client}
                          </span>

                        </div>

                        <div
                          className={`status ${item.status.toLowerCase()}`}
                        >
                          ● {item.status}
                        </div>

                        <div className="usage">

                          <small>
                            Utilization
                          </small>

                          <span>
                            {item.usage}
                          </span>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>

                {/* RECENT ACTIVITY */}
                <div className="panel activity-panel">

                  <div className="panel-header">

                    <div>
                      <h3>
                        Recent Activity
                      </h3>

                      <p>
                        Latest asset events
                      </p>
                    </div>

                  </div>

                  <div className="activity-list">

                    <div className="activity">

                      <span className="activity-dot checkout" />

                      <div>
                        <strong>
                          CAT-320-01 checked out
                        </strong>

                        <small>
                          ABC Construction · 10:42 AM
                        </small>
                      </div>

                    </div>

                    <div className="activity">

                      <span className="activity-dot alert" />

                      <div>
                        <strong>
                          Usage anomaly detected
                        </strong>

                        <small>
                          CAT-320-01 · 10:31 AM
                        </small>
                      </div>

                    </div>

                    <div className="activity">

                      <span className="activity-dot return" />

                      <div>
                        <strong>
                          CAT-950-02 returned
                        </strong>

                        <small>
                          Inspection pending · 10:12 AM
                        </small>
                      </div>

                    </div>

                    <div className="activity">

                      <span className="activity-dot checkout" />

                      <div>
                        <strong>
                          CAT-D6-04 became available
                        </strong>

                        <small>
                          Hyderabad · 09:48 AM
                        </small>
                      </div>

                    </div>

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