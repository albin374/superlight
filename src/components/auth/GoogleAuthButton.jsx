import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './GoogleAuthButton.css';

const DEFAULT_CLIENT_ID = '993906976196-kt13920p8sb9adfdlpnglokg18is08of.apps.googleusercontent.com';

const GoogleAuthButton = ({
  text = 'continue_with', // 'signin_with' | 'signup_with' | 'continue_with'
  onSuccess,
  onError,
  disabled = false
}) => {
  const { loginWithGoogle } = useAuth();
  const googleBtnContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      if (onError) onError('Google did not return valid credentials. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginWithGoogle(response.credential);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      if (onError) onError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let checkInterval = null;
    let attempts = 0;

    const setupGoogleButton = () => {
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          // Clear previous render to avoid duplicate buttons
          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            
            // Calculate width based on container width or fallback to 360
            const containerWidth = googleBtnContainerRef.current.offsetWidth || 360;
            const buttonWidth = Math.min(Math.max(containerWidth, 240), 400);

            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text,
              shape: 'rectangular',
              logo_alignment: 'left',
              width: buttonWidth
            });
          }

          setScriptLoaded(true);
          if (checkInterval) clearInterval(checkInterval);
        } catch (e) {
          console.warn('Error initializing Google Identity Services button:', e);
        }
      }
    };

    // If script is already loaded
    if (window.google?.accounts?.id) {
      setupGoogleButton();
    } else {
      // Check every 100ms up to 50 times (5 seconds)
      checkInterval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id) {
          setupGoogleButton();
        } else if (attempts >= 50) {
          clearInterval(checkInterval);
        }
      }, 100);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [clientId, text]);

  const handleCustomClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  const getCustomLabel = () => {
    if (text === 'signup_with') return 'Sign up with Google';
    if (text === 'signin_with') return 'Sign in with Google';
    return 'Continue with Google';
  };

  return (
    <div className={`google-auth-wrapper ${disabled || isLoading ? 'disabled' : ''}`}>
      {isLoading && (
        <div className="google-auth-loading-overlay">
          <span className="google-spinner"></span>
          <span>Connecting with Google...</span>
        </div>
      )}

      {/* Official Google GSI Render Container */}
      <div 
        ref={googleBtnContainerRef} 
        className={`google-official-btn-container ${scriptLoaded ? 'visible' : 'hidden'}`}
      />

      {/* Fallback Styled Button while script is initializing */}
      {!scriptLoaded && (
        <button
          type="button"
          className="google-custom-fallback-btn"
          onClick={handleCustomClick}
          disabled={disabled || isLoading}
        >
          <svg className="google-g-logo" viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="google-btn-text">{getCustomLabel()}</span>
        </button>
      )}
    </div>
  );
};

export default GoogleAuthButton;

