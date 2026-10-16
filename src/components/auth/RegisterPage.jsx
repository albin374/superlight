import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Zap,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GoogleAuthButton from './GoogleAuthButton';
import './LoginPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { name, username, email, phone, password, confirmPassword } = formData;

    // Validation
    if (!username.trim()) {
      setError('Please choose a username.');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      setError('Username can only contain letters, numbers, underscores, and dashes.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        name: name.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password
      });

      setSuccess(res.message || 'Account created successfully! Redirecting...');
      setTimeout(() => {
        const destination = location.state?.from || '/';
        navigate(destination, { replace: true });
      }, 700);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information and try again.');
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
          <span>Register</span>
        </div>

        <div className="auth-card-wrapper">
          <div className="auth-card">
            
            {/* Header Tabs */}
            <div className="auth-tabs">
              <button 
                type="button" 
                className="auth-tab"
                onClick={() => navigate('/login')}
              >
                <LogIn size={16} />
                Log In
              </button>
              <button 
                type="button" 
                className="auth-tab active"
                onClick={() => navigate('/register')}
              >
                <UserPlus size={16} />
                Register
              </button>
            </div>

            {/* Brand Title */}
            <div className="auth-header">
              <h1>Create an Account</h1>
              <p>Register with your username and email address to easily track orders, request wholesale quotes, and manage your account.</p>
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
              text="signup_with"
              onSuccess={(result) => {
                setSuccess(result.message || 'Account created successfully with Google! Redirecting...');
                setTimeout(() => {
                  const destination = location.state?.from || '/';
                  navigate(destination, { replace: true });
                }, 700);
              }}
              onError={(errMsg) => setError(errMsg)}
              disabled={isLoading}
            />

            <div className="auth-social-separator">
              <span>Or register with email address</span>
            </div>

            {/* Register Form */}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              
              {/* Full Name & Username in 2 columns */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="regName">
                    Full Name <span className="optional">(Optional)</span>
                  </label>
                  <div className="input-with-icon">
                    <User size={18} className="field-icon" />
                    <input
                      id="regName"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="regUsername">
                    Username <span className="required">*</span>
                  </label>
                  <div className="input-with-icon">
                    <User size={18} className="field-icon" />
                    <input
                      id="regUsername"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Username"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label htmlFor="regEmail">
                  Email Address <span className="required">*</span>
                </label>
                <div className="input-with-icon">
                  <Mail size={18} className="field-icon" />
                  <input
                    id="regEmail"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label htmlFor="regPhone">
                  Phone / WhatsApp <span className="optional">(Optional)</span>
                </label>
                <div className="input-with-icon">
                  <Phone size={18} className="field-icon" />
                  <input
                    id="regPhone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Password & Confirm Password in 2 columns */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="regPassword">
                    Password <span className="required">*</span>
                  </label>
                  <div className="input-with-icon">
                    <Lock size={18} className="field-icon" />
                    <input
                      id="regPassword"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Password"
                      autoComplete="new-password"
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

                <div className="form-group">
                  <label htmlFor="regConfirmPassword">
                    Confirm Password <span className="required">*</span>
                  </label>
                  <div className="input-with-icon">
                    <Lock size={18} className="field-icon" />
                    <input
                      id="regConfirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Card Footer Link to Login */}
            <div className="auth-footer-prompt">
              Already have an account?{' '}
              <Link to="/login" className="auth-switch-link">
                Log in here
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="auth-trust-row">
              <div className="trust-badge">
                <ShieldCheck size={16} />
                <span>Encrypted & Protected</span>
              </div>
              <div className="trust-badge">
                <Zap size={16} />
                <span>Fast 1-Click Ordering</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

