import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import {
  personCircleOutline,
  mailOutline,
  shieldCheckmarkOutline,
  serverOutline,
  closeOutline,
  idCardOutline,
} from 'ionicons/icons';

import { getUserProfile, UserProfile} from '../utils/userProfile';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());

  useEffect(() => {
    function handleUpdate(e: any) {
      if (e.detail) setProfile(e.detail);
    }
    window.addEventListener('cat-user-profile-changed', handleUpdate);
    return () => window.removeEventListener('cat-user-profile-changed', handleUpdate);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="cat-profile-backdrop" onClick={onClose}>
      <div className="cat-profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="cat-profile-header">
          <div className="cat-profile-badge-top">
            <span className="cat-pulse-indicator"></span>
            OPERATOR SESSION ACTIVE // TELEMATICS NODE
          </div>
          <button className="cat-close-btn" onClick={onClose} title="Close Profile">
            <IonIcon icon={closeOutline} />
          </button>
        </div>

        {/* PROFILE HERO */}
        <div className="cat-profile-hero">
          <div className="cat-avatar-ring">
            <IonIcon icon={personCircleOutline} />
          </div>
          <div className="cat-profile-hero-info">
            <h2>{profile.name}</h2>
            <span className="cat-role-tag">{profile.role}</span>
          </div>
        </div>

        {/* METADATA GRID */}
        <div className="cat-profile-grid">
          <div className="cat-profile-field">
            <div className="field-icon">
              <IonIcon icon={mailOutline} />
            </div>
            <div className="field-body">
              <label>Registered Email Address</label>
              <div className="field-val email-val">{profile.email}</div>
            </div>
          </div>

          <div className="cat-profile-field">
            <div className="field-icon">
              <IonIcon icon={idCardOutline} />
            </div>
            <div className="field-body">
              <label>Operator Telematics ID</label>
              <div className="field-val font-mono">{profile.operatorId}</div>
            </div>
          </div>

          <div className="cat-profile-field">
            <div className="field-icon">
              <IonIcon icon={shieldCheckmarkOutline} />
            </div>
            <div className="field-body">
              <label>Authorization Level</label>
              <div className="field-val">Level 4 — Fleet Director & Dispatcher</div>
            </div>
          </div>

          <div className="cat-profile-field">
            <div className="field-icon">
              <IonIcon icon={serverOutline} />
            </div>
            <div className="field-body">
              <label>Connected Cloud Database</label>
              <div className="field-val highlight-green">{profile.activeDatabase}</div>
            </div>
          </div>
        </div>

        {/* MODAL ACTIONS */}
        {/* MODAL ACTIONS */}
<div className="cat-profile-actions">
  <button className="cat-modal-close-btn" onClick={onClose}>
    Back to Dashboard
  </button>
</div>
      </div>
    </div>
  );
};

export default ProfileModal;
