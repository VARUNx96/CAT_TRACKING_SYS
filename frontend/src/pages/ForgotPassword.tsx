import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import {
  resetPassword,
  confirmResetPassword,
} from 'aws-amplify/auth';

import './ForgotPassword.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [step, setStep] = useState<'email' | 'reset'>('email');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /*
   * SEND PASSWORD RESET CODE
   */
  const handleSendCode = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const finalEmail = email.trim().toLowerCase();

    if (!finalEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword({
        username: finalEmail,
      });

      console.log('Password reset result:', result);

      /*
       * Cognito normally requires a confirmation code.
       */
      if (
        result.nextStep?.resetPasswordStep ===
        'CONFIRM_RESET_PASSWORD_WITH_CODE'
      ) {
        setStep('reset');

        setSuccess(
          'A password reset code has been sent to your email.'
        );
      } else {
        setSuccess(
          'Follow the instructions provided to reset your password.'
        );
      }

    } catch (error: any) {
      console.error(
        'Password reset error:',
        error
      );

      const errorName = error?.name;
      const errorMessage = error?.message;

      if (
        errorName === 'UserNotFoundException'
      ) {
        setError(
          'No account was found with this email address.'
        );
      } else if (
        errorName === 'LimitExceededException'
      ) {
        setError(
          'Too many reset attempts. Please wait and try again later.'
        );
      } else if (
        errorName === 'InvalidParameterException'
      ) {
        setError(
          errorMessage ||
            'The email address is invalid.'
        );
      } else {
        setError(
          errorMessage ||
            'Unable to send the password reset code.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * SET NEW PASSWORD
   */
  const handleResetPassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!confirmationCode.trim()) {
      setError(
        'Please enter the verification code.'
      );
      return;
    }

    if (!newPassword) {
      setError(
        'Please enter a new password.'
      );
      return;
    }

    setLoading(true);

    try {
      await confirmResetPassword({
        username: email.trim().toLowerCase(),
        confirmationCode:
          confirmationCode.trim(),
        newPassword,
      });

      setSuccess(
        'Password reset successfully. Redirecting to sign in...'
      );

      /*
       * Send user back to Login after
       * successful password reset.
       */
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);

    } catch (error: any) {
      console.error(
        'Confirm password reset error:',
        error
      );

      const errorName = error?.name;
      const errorMessage = error?.message;

      if (
        errorName === 'CodeMismatchException'
      ) {
        setError(
          'Incorrect verification code.'
        );
      } else if (
        errorName === 'ExpiredCodeException'
      ) {
        setError(
          'The verification code has expired. Please request a new code.'
        );
      } else if (
        errorName === 'InvalidPasswordException'
      ) {
        setError(
          'The new password does not meet the required security requirements.'
        );
      } else {
        setError(
          errorMessage ||
            'Unable to reset your password.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * SEND RESET CODE AGAIN
   */
  const handleResendCode = async () => {
    setError('');
    setSuccess('');

    const finalEmail = email.trim().toLowerCase();

    if (!finalEmail) {
      setError(
        'Please enter your email address.'
      );
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        username: finalEmail,
      });

      setSuccess(
        'A new password reset code has been sent.'
      );

    } catch (error: any) {
      console.error(
        'Resend reset code error:',
        error
      );

      setError(
        error?.message ||
          'Unable to resend the reset code.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent
        fullscreen
        className="forgot-password-page"
      >
        <div className="forgot-password-container">

          <div className="forgot-password-card">

            {/* Logo */}
            <div className="forgot-password-logo">
              <img
                src="/images/full-light.jpg"
                alt="Caterpillar CAT"
              />
            </div>

            {/* Heading */}
            <h1>
              {step === 'email'
                ? 'Forgot Password?'
                : 'Reset Password'}
            </h1>

            <p className="forgot-password-subtitle">
              {step === 'email'
                ? 'Enter your registered email address and we will send you a password reset code.'
                : `Enter the verification code sent to ${email}`}
            </p>

            {/* ERROR */}
            {error && (
              <div className="forgot-password-error">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="forgot-password-success">
                {success}
              </div>
            )}

            {step === 'email' ? (

              /*
               * EMAIL FORM
               */
              <form onSubmit={handleSendCode}>

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

                <button
                  type="submit"
                  className="forgot-password-button"
                  disabled={loading}
                >
                  {loading
                    ? 'Sending Code...'
                    : 'Send Reset Code'}
                </button>

              </form>

            ) : (

              /*
               * RESET PASSWORD FORM
               */
              <form
                onSubmit={
                  handleResetPassword
                }
              >

                <div className="form-group">

                  <label>
                    Verification Code
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

                <div className="form-group">

                  <label>
                    New Password
                  </label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                    placeholder="Create a new password"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="forgot-password-button"
                  disabled={loading}
                >
                  {loading
                    ? 'Resetting Password...'
                    : 'Reset Password'}
                </button>

                <button
                  type="button"
                  className="resend-code-button"
                  onClick={
                    handleResendCode
                  }
                  disabled={loading}
                >
                  Resend Reset Code
                </button>

              </form>

            )}

            {/* BACK TO LOGIN */}
            <p className="back-to-login">
              Remember your password?{' '}

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

export default ForgotPassword;