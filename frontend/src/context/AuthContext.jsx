import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Re-authenticate user on load if token exists
  useEffect(() => {
    const bootstrapUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authService.getProfile();
          if (res.success) {
            // Find additional name from local session
            const cachedUser = JSON.parse(localStorage.getItem('user'));
            setUser({
              ...res.data,
              name: cachedUser?.name || res.data.username,
              profileId: cachedUser?.profileId,
              departmentId: cachedUser?.profile?.department_id,
              classId: cachedUser?.profile?.class_id
            });
          } else {
            logout();
          }
        } catch (err) {
          console.error('Session bootstrap failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    bootstrapUser();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(username, password);
      if (res.success && res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setUser(res.user);
        return res.user;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const syncProfile = async () => {
    try {
      const res = await authService.getProfile();
      if (res.success) {
        setUser((prev) => ({
          ...prev,
          ...res.data,
          profile: res.data.profile
        }));
      }
    } catch (err) {
      console.error('Failed to sync profile:', err.message);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    syncProfile,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
