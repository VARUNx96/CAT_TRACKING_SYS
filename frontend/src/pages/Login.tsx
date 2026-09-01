import { IonContent, IonPage } from '@ionic/react';

import './Login.css';

const Login: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen className="login-page">

        <div className="login-container">

          <div className="login-card">

            {/* Logo */}
            <div className='login-logo'>
              <img
                src="/images/full-light.jpg"
                alt="Caterpillar CAT"
               />
            </div>

            {/* Heading */}
            <h1>Welcome Back</h1>

            <p className="login-subtitle">
              Sign in to your account
            </p>

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
                placeholder="Enter your password"
              />
            </div>

            {/* Forgot password */}
            <div className="forgot-password">
              <a href="#">Forgot password?</a>
            </div>

            {/* Login */}
            <button className="login-button"  onClick={() => {
window.location.href = '/home';
}}>
              Login
            </button>

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