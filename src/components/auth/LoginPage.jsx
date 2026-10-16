import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Zap,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GoogleAuthButton from './GoogleAuthButton';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to home or destination
  useEffect(() => {
    window.scrollTo(0, 0);
    if (isAuthenticated) {
      const destination = location.state?.from || '/';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!usernameOrEmail.trim()) {
      setError('Please enter your username or email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(usernameOrEmail.trim(), password);
      setSuccess(res.message || 'Login successful! Redirecting...');
      setTimeout(() => {
        const destination = location.state?.from || '/';
        navigate(destination, { replace: true });
      }, 700);
    } catch (err) {
      setError(err.message || 'Invalid username/email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Breadcrumbs */}
        <div className="auth-breadcrumbs">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span>Login</span>
        </div>

        <div className="auth-card-wrapper">
          <div className="auth-card">
            
            {/* Header Tabs */}
            <div className="auth-tabs">
              <button 
                type="button" 
                className="auth-tab active"
                onClick={() => navigate('/login')}
              >
                <LogIn size={16} />
                Log In
              </button>
              <button 
                type="button" 
                className="auth-tab"
                onClick={() => navigate('/register')}
              >
                <User size={16} />
                Register
              </button>
            </div>

            {/* Brand Title */}
            <div className="auth-header">
              <h1>Welcome Back</h1>
              <p>Sign in with your username or email address to access your orders, inquiries, and saved wishlist.</p>
            </div>

            {/* Error / Success Feedback */}
            {error && (
              <div className="auth-alert error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="auth-alert success">
                <CheckCircle2 size={18} />
                <span>{success}</span>
              </div>
            )}

            {/* Google Authentication */}
            <GoogleAuthButton
              text="continue_with"
              onSuccess={(result) => {
                setSuccess(result.message || 'Signed in successfully with Google! Redirecting...');
                setTimeout(() => {
                  const destination = location.state?.from || '/';
                  navigate(destination, { replace: true });
                }, 700);
              }}
              onError={(errMsg) => setError(errMsg)}
              disabled={isLoading}
            />

            <div className="auth-social-separator">
              <span>Or continue with username or email</span>
            </div>

            {/* Login Form */}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              
              {/* Username or Email Input */}
              <div className="form-group">
                <label htmlFor="loginIdentifier">
                  Username or Email Address <span className="required">*</span>
                </label>
                <div className="input-with-icon">
                  <User size={18} className="field-icon" />
                  <input
                    id="loginIdentifier"
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => {
                      setUsernameOrEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Username or Email Address"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="loginPassword">
                    Password <span className="required">*</span>
                  </label>
                </div>
                <div className="input-with-icon">
                  <Lock size={18} className="field-icon" />
                  <input
                    id="loginPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="form-options">
                <label className="remember-me-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Card Footer Link to Register */}
            <div className="auth-footer-prompt">
              Don't have an account yet?{' '}
              <Link to="/register" className="auth-switch-link">
                Create one now
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="auth-trust-row">
              <div className="trust-badge">
                <ShieldCheck size={16} />
                <span>Secure Authentication</span>
              </div>
              <div className="trust-badge">
                <Zap size={16} />
                <span>Instant Order Tracking</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

