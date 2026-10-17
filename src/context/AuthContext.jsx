import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('superlight_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to parse user from localStorage:', e);
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('superlight_token') || null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync token & user to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('superlight_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('superlight_user');
      }
    } catch (e) {
      console.error('Failed to save user:', e);
    }
  }, [user]);

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('superlight_token', token);
      } else {
        localStorage.removeItem('superlight_token');
      }
    } catch (e) {
      console.error('Failed to save token:', e);
    }
  }, [token]);

  // Verify token on mount
  useEffect(() => {
    if (!token) return;

    fetch('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          // Token expired or invalid
          setUser(null);
          setToken(null);
        }
      })
      .catch(() => {
        // Network error - keep cached user for offline resilience
      });
  }, [token]);

  // Login with username OR email
  const login = async (usernameOrEmail, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      setUser(data.user);
      setToken(data.token);
      return { success: true, user: data.user, message: data.message };
    } finally {
      setLoading(false);
    }
  };

  // Register with username, email, password, name, phone
  const register = async ({ username, email, password, name, phone }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, name, phone })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      setUser(data.user);
      setToken(data.token);
      return { success: true, user: data.user, message: data.message };
    } finally {
      setLoading(false);
    }
  };

  // Login / Register with Google OAuth credential
  const loginWithGoogle = async (credential, mode = 'login') => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, mode })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const error = new Error(data.message || 'Google authentication failed. Please try again.');
        error.notRegistered = data.notRegistered;
        error.email = data.email;
        throw error;
      }

      setUser(data.user);
      setToken(data.token);
      return { success: true, user: data.user, message: data.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('superlight_user');
    localStorage.removeItem('superlight_token');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    register,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

