import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { saveUserProfile } from '../utils/userProfile';

import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const finalEmail = email.trim() || 'varun.admin@cat-telematics.internal';
    const computedName = email.trim()
      ? email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Varun P.';

    saveUserProfile({
      name: computedName,
      email: finalEmail,
      role: 'Chief Fleet Operations Director',
    });

    window.location.href = '/home';
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-page">
        <div className="login-container">
          <div className="login-card">

            {/* Logo */}
            <div className="login-logo">
              <img
                src="/images/full-light.jpg"
                alt="Caterpillar CAT"
              />
            </div>

            {/* Heading */}
            <h1>Welcome Back</h1>

            <p className="login-subtitle">
              Sign in to your Caterpillar Telematics account
            </p>

            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="form-group">
                <label>Registered Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@caterpillar-fleet.com"
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              {/* Forgot password */}
              <div className="forgot-password">
                <a href="#">Forgot password?</a>
              </div>

              {/* Login Button */}
              <button type="submit" className="login-button">
                Sign In to Fleet Command
              </button>
            </form>

            {/* Signup */}
            <p className="signup-text">
              Don't have an account?{' '}
              <a href="/signup">Sign Up</a>
            </p>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;