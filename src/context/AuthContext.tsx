import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Define the hardcoded admin email address
const ADMIN_EMAIL = 'admin@stcet.edu.in';

interface AuthContextType {
  isAuthenticated: boolean;
  currentAdminEmail: string | null;
  userRole: 'admin' | 'core_team' | null;
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
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        return false;
      }

      // WORKAROUND: Determine role based on email
      const role = data.email === ADMIN_EMAIL ? 'admin' : 'core_team';

      setIsAuthenticated(true);
      setCurrentAdminEmail(data.email);
      setUserRole(role);
      sessionStorage.setItem(AUTH_KEY, 'true');
      sessionStorage.setItem(ADMIN_EMAIL_KEY, data.email);
      sessionStorage.setItem(USER_ROLE_KEY, role);
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
      // This function is only for the admin
      const { error } = await supabase
        .from('admin_users')
        .update({ email: newEmail, password: newPassword, updated_at: new Date() })
        .eq('email', currentEmail);

      if (error) {
        console.error('Update error:', error);
        return false;
      }

      // If the admin changes their own email, update it in the session
      if (currentEmail === ADMIN_EMAIL) {
        // This is a bit tricky since ADMIN_EMAIL is hardcoded, but for the session it's fine
        setCurrentAdminEmail(newEmail);
        sessionStorage.setItem(ADMIN_EMAIL_KEY, newEmail);
      }
      return true;
    } catch (error) {
      console.error('Change credentials error:', error);
      return false;
    }
  };

  const getCoreTeamCredentials = async (): Promise<{ email: string; password: string } | null> => {
    try {
      // Find the user who is NOT the admin
      const { data, error } = await supabase
        .from('admin_users')
        .select('email, password')
        .not('email', 'eq', ADMIN_EMAIL)
        .limit(1)
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
      // Find the current Core Team user to get their ID for a stable update
      const { data: coreUser, error: findError } = await supabase
        .from('admin_users')
        .select('id')
        .not('email', 'eq', ADMIN_EMAIL)
        .limit(1)
        .single();

      if (findError || !coreUser) {
        // If no core team user exists, create one
        const { error: insertError } = await supabase.from('admin_users').insert({
          email: newEmail,
          password: newPassword,
        });
        if (insertError) {
          console.error('Error creating core team user:', insertError);
          return false;
        }
        return true;
      }

      // If a core team user exists, update them
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ email: newEmail, password: newPassword, updated_at: new Date() })
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
        updateCoreTeamCredentials,
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