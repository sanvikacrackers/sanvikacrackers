import { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);
const SESSION_KEY = 'sanvika_staff_session';

export function AuthProvider({ children }) {
  const [staff, setStaff] = useState(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const signIn = async (email, password) => {
    const { data, error } = await supabase
      .from('staff_users')
      .select('id, name, email, role, is_active, created_at')
      .eq('email', email.trim().toLowerCase())
      .eq('password', password)
      .single();

    if (error || !data) throw new Error('Invalid email or password.');
    if (!data.is_active) throw new Error('Your account has been deactivated. Contact the administrator.');

    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    setStaff(data);
    return data;
  };

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    setStaff(null);
  };

  return (
    <AuthContext.Provider value={{
      user: staff,
      profile: staff,
      role: staff?.role ?? null,
      isAdmin: staff?.role === 'admin' && staff?.is_active === true,
      isStaff: staff?.role === 'staff' && staff?.is_active === true,
      loading: false,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
