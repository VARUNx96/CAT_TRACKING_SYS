import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { saveUserProfile } from '../utils/userProfile';

import './Signup.css';

const Signup: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = fullName.trim() || 'Varun P.';
    const finalEmail = email.trim() || 'varun.admin@cat-telematics.internal';

    saveUserProfile({
      name: finalName,
      email: finalEmail,
      role: 'Fleet Operations Director',
    });

    window.location.href = '/home';
  };

  return (
    <IonPage>
      <IonContent fullscreen className="signup-page">
        <div className="signup-container">
          <div className="signup-card">

            {/* Logo */}
            <div className="signup-logo">
              <img
                src="/images/full-light.jpg"
                alt="Caterpillar CAT"
              />
            </div>

            {/* Heading */}
            <h1>Create Account</h1>

            <p className="signup-subtitle">
              Register as a certified Caterpillar Fleet Operator
            </p>

            <form onSubmit={handleSignup}>
              {/* Full Name */}
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label>Registered Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@caterpillar-fleet.com"
                  required
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  required
                />
              </div>

              {/* Create Account */}
              <button type="submit" className="signup-button">
                Register Fleet Account
              </button>
            </form>

            {/* Login */}
            <p className="login-text">
              Already have an account?{' '}
              <a href="/login">Sign In</a>
            </p>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Signup;