import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_CREDENTIALS = {
  email: 'admin',
  password: 'AdminSTCET2024!',
};

const AUTH_KEY = 'gcskb_admin_auth';
const CREDS_KEY = 'gcskb_admin_creds';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem(AUTH_KEY);
    if (auth === 'true') {
      setIsAuthenticated(true);
    }

    const savedCreds = localStorage.getItem(CREDS_KEY);
    if (!savedCreds) {
      localStorage.setItem(CREDS_KEY, JSON.stringify(ADMIN_CREDENTIALS));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const credsStr = localStorage.getItem(CREDS_KEY);
    const creds = credsStr ? JSON.parse(credsStr) : ADMIN_CREDENTIALS;

    if (email === creds.email && password === creds.password) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
  };

  const changePassword = (newPassword: string) => {
    const credsStr = localStorage.getItem(CREDS_KEY);
    const creds = credsStr ? JSON.parse(credsStr) : ADMIN_CREDENTIALS;
    creds.password = newPassword;
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
