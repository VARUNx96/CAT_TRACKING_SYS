import { IonContent, IonPage } from '@ionic/react';

import './Signup.css';

const Signup: React.FC = () => {
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
              Create your Caterpillar account
            </p>

            {/* Full Name */}
            <div className="form-group">
              <label>Full Name</label>

              <input
                type="text"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Create a password"
              />
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label>Confirm Password</label>

              <input
                type="password"
                placeholder="Confirm your password"
              />
            </div>

            {/* Create Account */}
            <button className="signup-button"   onClick={() => {
window.location.href = '/home';
}}>
              Create Account
            </button>

            {/* Login */}
            <p className="login-text">
              Already have an account?{' '}
              <a href="/login">Login</a>
            </p>

          </div>

        </div>

      </IonContent>
    </IonPage>
  );
};

export default Signup;