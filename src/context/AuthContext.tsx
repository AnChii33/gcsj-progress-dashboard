import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  currentAdminEmail: string | null;
  userRole: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  changeCredentials: (currentEmail: string, newEmail: string, newPassword: string) => Promise<boolean>;
  getCoreTeamCredentials: () => Promise<{ email: string; password: string } | null>;
  updateCoreTeamCredentials: (newEmail: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'gcskb_admin_auth';
const ADMIN_EMAIL_KEY = 'gcskb_admin_email';
const USER_ROLE_KEY = 'gcskb_user_role';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem(AUTH_KEY);
    const email = sessionStorage.getItem(ADMIN_EMAIL_KEY);
    const role = sessionStorage.getItem(USER_ROLE_KEY);
    if (auth === 'true' && email && role) {
      setIsAuthenticated(true);
      setCurrentAdminEmail(email);
      setUserRole(role);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('email, role') // Select only email and role
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        console.error('Login failed:', error?.message);
        return false;
      }

      setIsAuthenticated(true);
      setCurrentAdminEmail(data.email);
      setUserRole(data.role);
      sessionStorage.setItem(AUTH_KEY, 'true');
      sessionStorage.setItem(ADMIN_EMAIL_KEY, data.email);
      sessionStorage.setItem(USER_ROLE_KEY, data.role);
      return true;
    } catch (error) {
      console.error('Login error:', error);
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
        .update({
          email: newEmail,
          password: newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('email', currentEmail)
        .eq('role', 'admin'); // Ensure only admins can change their own password this way

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

  const getCoreTeamCredentials = async (): Promise<{ email: string; password: string } | null> => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('email, password')
        .eq('role', 'core_team')
        .single();

      if (error) {
        console.error('Error fetching core team credentials:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error fetching core team credentials:', error);
      return null;
    }
  };

  const updateCoreTeamCredentials = async (
    newEmail: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      // First, find the current Core Team user to update
      const { data: coreUser, error: findError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('role', 'core_team')
        .single();

      if (findError || !coreUser) {
        console.error('Could not find Core Team user to update:', findError);
        return false;
      }

      const { error: updateError } = await supabase
        .from('admin_users')
        .update({
          email: newEmail,
          password: newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', coreUser.id);

      if (updateError) {
        console.error('Error updating core team credentials:', updateError);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error updating core team credentials:', error);
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
        getCoreTeamCredentials,
        updateCoreTeamCredentials
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