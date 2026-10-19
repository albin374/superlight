import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, X, Lock } from 'lucide-react';
import './LoginPromptModal.css';

const LoginPromptModal = ({
  isOpen,
  title = 'Login Required',
  message = 'Please login first and then continue',
  subtitle = 'You need an account to place an order via WhatsApp. Please sign in or register to proceed.',
  redirectTo = null,
  onClose
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && onClose) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentDestination = redirectTo || (location.pathname + location.search);

  const handleGoToLogin = () => {
    if (onClose) onClose();
    navigate('/login', {
      state: {
        from: currentDestination,
        message: message || 'Please login first and then continue with your order.'
      }
    });
  };

  const handleGoToRegister = () => {
    if (onClose) onClose();
    navigate('/register', {
      state: {
        from: currentDestination
      }
    });
  };

  return (
    <div className="login-prompt-overlay" onClick={onClose}>
      <div 
        className="login-prompt-box" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
      >
        <button 
          type="button" 
          className="login-prompt-close" 
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="login-prompt-content">
          <div className="login-prompt-icon-wrapper">
            <Lock size={30} strokeWidth={2.2} />
          </div>

          <div className="login-prompt-badge">Authentication Needed</div>

          <h3 id="login-prompt-title" className="login-prompt-title">{title}</h3>

          <div className="login-prompt-message">
            {message}
          </div>

          <p className="login-prompt-subtitle">
            {subtitle}
          </p>

          <div className="login-prompt-actions">
            <button 
              type="button" 
              className="login-prompt-btn-primary"
              onClick={handleGoToLogin}
            >
              <LogIn size={18} />
              Log In to Continue
            </button>

            <button 
              type="button" 
              className="login-prompt-btn-secondary"
              onClick={handleGoToRegister}
            >
              <UserPlus size={18} />
              Create an Account
            </button>

            <button 
              type="button" 
              className="login-prompt-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;

