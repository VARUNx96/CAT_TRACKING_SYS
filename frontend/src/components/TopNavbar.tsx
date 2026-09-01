import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import {
  arrowBackOutline,
  homeOutline,
  sunnyOutline,
  moonOutline,
  constructOutline,
  swapHorizontalOutline,
  speedometerOutline,
  notificationsOutline,
  analyticsOutline,
  schoolOutline,
} from 'ionicons/icons';

import { getInitialTheme, toggleTheme, Theme } from '../utils/theme';
import './TopNavbar.css';

interface TopNavbarProps {
  currentTitle: string;
  activePath?: string;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ currentTitle, activePath }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme());

  useEffect(() => {
    function handleThemeChange(e: any) {
      if (e.detail?.theme) {
        setThemeState(e.detail.theme);
      }
    }
    window.addEventListener('cat-theme-changed', handleThemeChange);
    return () => window.removeEventListener('cat-theme-changed', handleThemeChange);
  }, []);

  const handleToggle = () => {
    const next = toggleTheme();
    setThemeState(next);
  };

  return (
    <div className="cat-top-navbar">
      <div className="cat-nav-left">
        {/* HIGH-VISIBILITY CATERPILLAR YELLOW DASHBOARD BUTTON */}
        <a href="/home" className="cat-return-dashboard-btn" title="Back to Main Fleet Dashboard">
          <IonIcon icon={arrowBackOutline} />
          <span>Dashboard</span>
        </a>

        <div className="cat-nav-breadcrumb">
          <span className="divider">/</span>
          <span className="current-title">{currentTitle}</span>
        </div>
      </div>

      {/* QUICK PAGE SWITCHER PILLS */}
      <div className="cat-nav-links">
        <a href="/assets" className={`cat-nav-pill ${activePath === '/assets' ? 'active' : ''}`}>
          <IonIcon icon={constructOutline} />
          <span>Assets</span>
        </a>
        <a href="/rentals" className={`cat-nav-pill ${activePath === '/rentals' ? 'active' : ''}`}>
          <IonIcon icon={swapHorizontalOutline} />
          <span>Rentals</span>
        </a>
        <a href="/usage" className={`cat-nav-pill ${activePath === '/usage' ? 'active' : ''}`}>
          <IonIcon icon={speedometerOutline} />
          <span>Usage</span>
        </a>
        <a href="/alerts" className={`cat-nav-pill ${activePath === '/alerts' ? 'active' : ''}`}>
          <IonIcon icon={notificationsOutline} />
          <span>Alerts</span>
        </a>
        <a href="/insights" className={`cat-nav-pill ${activePath === '/insights' ? 'active' : ''}`}>
          <IonIcon icon={analyticsOutline} />
          <span>AI Insights</span>
        </a>
        <a href="/operator-guides" className={`cat-nav-pill ${activePath === '/operator-guides' ? 'active' : ''}`}>
          <IonIcon icon={schoolOutline} />
          <span>Guides</span>
        </a>
      </div>

      <div className="cat-nav-right">
        {/* GLOBAL THEME SWITCHER */}
        <button
          onClick={handleToggle}
          className="cat-theme-toggle-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          <IonIcon icon={theme === 'dark' ? sunnyOutline : moonOutline} style={{ color: '#FFCD11' }} />
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </div>
  );
};

export default TopNavbar;
