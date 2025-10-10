import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// --- HARDCODED CREDENTIALS FOR CORE TEAM ---
const CORE_TEAM_EMAIL = 'gdgoncampus@stcet.ac.in';
const CORE_TEAM_PASSWORD = 'GDGOC-25-08-2025';
// ---

interface AuthContextType {
  isAuthenticated: boolean;
  currentAdminEmail: string | null;
  userRole: 'admin' | 'core_team' | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  changeCredentials: (currentEmail: string, newEmail: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'gcskb_admin_auth';
const ADMIN_EMAIL_KEY = 'gcskb_admin_email';
const USER_ROLE_KEY = 'gcskb_user_role';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'core_team' | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem(AUTH_KEY);
    const email = sessionStorage.getItem(ADMIN_EMAIL_KEY);
    const role = sessionStorage.getItem(USER_ROLE_KEY) as 'admin' | 'core_team' | null;
    if (auth === 'true' && email && role) {
      setIsAuthenticated(true);
      setCurrentAdminEmail(email);
      setUserRole(role);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Step 1: Check for hardcoded Core Team credentials
    if (email === CORE_TEAM_EMAIL && password === CORE_TEAM_PASSWORD) {
      const role = 'core_team';
      setIsAuthenticated(true);
      setCurrentAdminEmail(email);
      setUserRole(role);
      sessionStorage.setItem(AUTH_KEY, 'true');
      sessionStorage.setItem(ADMIN_EMAIL_KEY, email);
      sessionStorage.setItem(USER_ROLE_KEY, role);
      return true;
    }

    // Step 2: If not Core Team, check database for Admin credentials
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle(); // Use maybeSingle() to prevent errors on no match

      if (error || !data) {
        return false;
      }
      
      // If we get here, it's the admin
      const role = 'admin';
      setIsAuthenticated(true);
      setCurrentAdminEmail(data.email);
      setUserRole(role);
      sessionStorage.setItem(AUTH_KEY, 'true');
      sessionStorage.setItem(ADMIN_EMAIL_KEY, data.email);
      sessionStorage.setItem(USER_ROLE_KEY, role);
      return true;

    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentAdminEmail(null);
    setUserRole(null);
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(ADMIN_EMAIL_KEY);
    sessionStorage.removeItem(USER_ROLE_KEY);
  };

  const changeCredentials = async (
    currentEmail: string,
    newEmail: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ email: newEmail, password: newPassword, updated_at: new Date() })
        .eq('email', currentEmail);

      if (error) {
        console.error('Update error:', error);
        return false;
      }

      setCurrentAdminEmail(newEmail);
      sessionStorage.setItem(ADMIN_EMAIL_KEY, newEmail);
      return true;
    } catch (error) {
      console.error('Change credentials error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentAdminEmail,
        userRole,
        login,
        logout,
        changeCredentials,
      }}
    >
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