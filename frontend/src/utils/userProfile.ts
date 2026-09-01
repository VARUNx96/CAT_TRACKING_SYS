/**
 * User Profile & Authentication Session Management.
 * Manages operator details, registered email, and logout flows.
 */

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  operatorId: string;
  department: string;
  activeDatabase: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Varun P.',
  email: 'varun@cat-telematics.internal',
  role: 'Chief Fleet Operations Director',
  operatorId: 'CAT-OP-8821',
  department: 'Heavy Fleet Telematics & Rental Logistics',
  activeDatabase: 'AWS DynamoDB (SmartRentalTracking // us-east-1)',
};

export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem('cat_user_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PROFILE, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse user profile from localStorage:', e);
  }
  return DEFAULT_PROFILE;
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const current = getUserProfile();
  const updated = { ...current, ...profile };
  localStorage.setItem('cat_user_profile', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('cat-user-profile-changed', { detail: updated }));
  return updated;
}

export function performLogout(): void {
  // Clean up session tokens
  localStorage.removeItem('cat_user_token');
  // Direct clean redirect to /login
  window.location.href = '/login';
}
