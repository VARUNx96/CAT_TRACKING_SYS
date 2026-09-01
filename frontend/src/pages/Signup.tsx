import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import {
  signUp,
  confirmSignUp,
  resendSignUpCode,
} from 'aws-amplify/auth';

import './Signup.css';

const Signup: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');

  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /*
   * CREATE COGNITO ACCOUNT
   */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const finalName = fullName.trim();
    const finalEmail = email.trim().toLowerCase();

    if (!finalName || !finalEmail || !password) {
      setError('Please complete all fields.');
      return;
    }

    setLoading(true);

    try {
      /*
       * CREATE USER IN AMAZON COGNITO
       */
      const result = await signUp({
        username: finalEmail,
        password,
        options: {
          userAttributes: {
            email: finalEmail,
            name: finalName,
          },
        },
      });

      console.log('Signup result:', result);

      /*
       * Cognito normally requires email verification.
       */
      if (
        result.nextStep?.signUpStep ===
        'CONFIRM_SIGN_UP'
      ) {
        setShowVerification(true);

        setSuccess(
          'Account created successfully. A verification code has been sent to your email.'
        );

        return;
      }

      /*
       * If Cognito does not require confirmation,
       * the account is already complete.
       */
      setSuccess(
        'Account created successfully. You can now sign in.'
      );

    } catch (error: any) {
      console.error('Signup error:', error);

      const errorName = error?.name;
      const errorMessage = error?.message;

      if (
        errorName === 'UsernameExistsException'
      ) {
        setError(
          'An account with this email already exists. Please sign in instead.'
        );
      } else if (
        errorName === 'InvalidPasswordException'
      ) {
        setError(
          'Password does not meet the required security requirements.'
        );
      } else if (
        errorName === 'InvalidParameterException'
      ) {
        setError(
          errorMessage ||
            'One or more signup fields are invalid.'
        );
      } else {
        setError(
          errorMessage ||
            'Unable to create your account. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * VERIFY EMAIL
   */
  const handleVerification = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const finalEmail = email.trim().toLowerCase();

    if (!confirmationCode.trim()) {
      setError(
        'Please enter the verification code.'
      );
      return;
    }

    setLoading(true);

    try {
      const result = await confirmSignUp({
        username: finalEmail,
        confirmationCode:
          confirmationCode.trim(),
      });

      console.log(
        'Confirmation result:',
        result
      );

      setSuccess(
        'Email verified successfully. Your account is ready. Redirecting to sign in...'
      );

      /*
       * Give the user a moment to see
       * the success message.
       */
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);

    } catch (error: any) {
      console.error(
        'Verification error:',
        error
      );

      const errorName = error?.name;
      const errorMessage = error?.message;

      if (
        errorName === 'CodeMismatchException'
      ) {
        setError(
          'Incorrect verification code. Please check your email and try again.'
        );
      } else if (
        errorName === 'ExpiredCodeException'
      ) {
        setError(
          'This verification code has expired. Please request a new code.'
        );
      } else if (
        errorName === 'NotAuthorizedException'
      ) {
        setError(
          'This account may already be verified. Try signing in.'
        );
      } else {
        setError(
          errorMessage ||
            'Unable to verify your email. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * RESEND VERIFICATION CODE
   */
  const handleResendCode = async () => {
    setError('');
    setSuccess('');

    const finalEmail = email.trim().toLowerCase();

    if (!finalEmail) {
      setError('Email address is required.');
      return;
    }

    setResending(true);

    try {
      await resendSignUpCode({
        username: finalEmail,
      });

      setSuccess(
        'A new verification code has been sent to your email.'
      );

    } catch (error: any) {
      console.error(
        'Resend verification error:',
        error
      );

      setError(
        error?.message ||
          'Unable to resend the verification code.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <IonPage>
      <IonContent
        fullscreen
        className="signup-page"
      >
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
            <h1>
              {showVerification
                ? 'Verify Your Email'
                : 'Create Account'}
            </h1>

            <p className="signup-subtitle">
              {showVerification
                ? `Enter the verification code sent to ${email}`
                : 'Register as a certified Caterpillar Fleet Operator'}
            </p>

            {/* ERROR */}
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

            {/* SUCCESS */}
            {success && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#f1f8e9',
                  border: '1px solid #a5d6a7',
                  color: '#2e7d32',
                  fontSize: '14px',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {success}
              </div>
            )}

            {!showVerification ? (
              /*
               * SIGNUP FORM
               */
              <form onSubmit={handleSignup}>

                {/* Full Name */}
                <div className="form-group">
                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label>
                    Registered Work Email
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
                    placeholder="Create a secure password"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Create Account */}
                <button
                  type="submit"
                  className="signup-button"
                  disabled={loading}
                >
                  {loading
                    ? 'Creating Account...'
                    : 'Register Fleet Account'}
                </button>

              </form>
            ) : (
              /*
               * EMAIL VERIFICATION FORM
               */
              <form
                onSubmit={handleVerification}
              >

                <div className="form-group">

                  <label>
                    Email Verification Code
                  </label>

                  <input
                    type="text"
                    value={confirmationCode}
                    onChange={(e) =>
                      setConfirmationCode(
                        e.target.value
                      )
                    }
                    placeholder="Enter verification code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    disabled={loading}
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="signup-button"
                  disabled={loading}
                >
                  {loading
                    ? 'Verifying...'
                    : 'Verify Email'}
                </button>

                {/* Resend */}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={
                    loading || resending
                  }
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '12px',
                    border: 'none',
                    background: 'transparent',
                    color: '#171717',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {resending
                    ? 'Sending...'
                    : 'Resend Verification Code'}
                </button>

              </form>
            )}

            {/* Login */}
            <p className="login-text">

              Already have an account?{' '}

              <a href="/login">
                Sign In
              </a>

            </p>

          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Signup;