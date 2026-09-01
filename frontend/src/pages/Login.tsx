import React, { useEffect, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import {
  signIn,
  getCurrentUser,
  fetchUserAttributes,
} from 'aws-amplify/auth';

import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');

  /*
   * CHECK IF A USER IS ALREADY SIGNED IN
   *
   * This prevents:
   * "There is already a signed in user."
   */
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        await getCurrentUser();

        // A user is already authenticated.
        // Send them directly to Home.
        window.location.href = '/home';
      } catch {
        // No authenticated user.
        // Normal login screen should remain visible.
      } finally {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, []);

  /*
   * LOGIN
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    const finalEmail = email.trim();

    if (!finalEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      /*
       * SIGN IN WITH AMAZON COGNITO
       */
      const result = await signIn({
        username: finalEmail,
        password,
      });

      /*
       * Cognito may require another step.
       *
       * For example:
       * - Email verification
       * - New password
       * - MFA
       */
      if (!result.isSignedIn) {
        const nextStep = result.nextStep?.signInStep;

        if (
          nextStep === 'CONFIRM_SIGN_UP'
        ) {
          setError(
            'Your email address has not been verified. Please verify your email before signing in.'
          );
        } else {
          setError(
            `Additional authentication is required: ${nextStep || 'unknown step'}.`
          );
        }

        return;
      }

      /*
       * LOGIN SUCCESSFUL
       *
       * Get Cognito attributes.
       *
       * This confirms the authenticated session
       * and allows the application to use the real
       * Cognito user information.
       */
      try {
        await getCurrentUser();
        await fetchUserAttributes();
      } catch (attributeError) {
        console.error(
          'Unable to fetch Cognito user attributes:',
          attributeError
        );
      }

      /*
       * Cognito has now created the authenticated
       * session and manages the JWT tokens.
       */
      window.location.href = '/home';
    } catch (error: any) {
      console.error('Login error:', error);

      const errorName = error?.name;
      const errorMessage = error?.message;

      if (
        errorName === 'UserNotConfirmedException'
      ) {
        setError(
          'Your email address has not been verified. Please verify your email before signing in.'
        );
      } else if (
        errorName === 'NotAuthorizedException'
      ) {
        setError(
          'Incorrect email or password.'
        );
      } else if (
        errorName === 'UserNotFoundException'
      ) {
        setError(
          'No account was found with this email address.'
        );
      } else if (
        errorName === 'PasswordResetRequiredException'
      ) {
        setError(
          'A password reset is required before you can sign in.'
        );
      } else {
        setError(
          errorMessage ||
            'Unable to sign in. Please check your credentials and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * SHOW NOTHING WHILE CHECKING EXISTING SESSION
   */
  if (checkingSession) {
    return (
      <IonPage>
        <IonContent
          fullscreen
          className="login-page"
        >
          <div className="login-container">
            <div className="login-card">
              <p
                style={{
                  textAlign: 'center',
                  color: '#171717',
                }}
              >
                Checking authentication...
              </p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent
        fullscreen
        className="login-page"
      >
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

            {/* ERROR MESSAGE */}
            {error && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#fff1f1',
                  border: '1px solid #e0a0a0',
                  color: '#a00000',
                  fontSize: '14px',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>

              {/* Email */}
              <div className="form-group">

                <label>
                  Registered Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="name@caterpillar-fleet.com"
                  autoComplete="email"
                  disabled={loading}
                  required
                />

              </div>

              {/* Password */}
              <div className="form-group">

                <label>
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

              </div>

              {/* Forgot password */}
              <div className="forgot-password">
                <a href="/forgot-password">
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading
                  ? 'Signing In...'
                  : 'Sign In to Fleet Command'}
              </button>

            </form>

            {/* Signup */}
            <p className="signup-text">

              Don't have an account?{' '}

              <a href="/signup">
                Sign Up
              </a>

            </p>

          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;