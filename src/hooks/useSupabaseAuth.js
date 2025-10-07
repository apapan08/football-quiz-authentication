// src/hooks/useSupabaseAuth.js
import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import supabase from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else {
        // On any other auth event, we are no longer in recovery mode.
        setIsPasswordRecovery(false);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }

    getInitialSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      setProfileLoading(true);
      supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setName(data?.username || '');
          setProfileLoading(false);
        });
    } else {
      setProfileLoading(false);
    }
  }, [user]);

  const updateProfile = useCallback(async (newName) => {
    if (!user) return;
    const newUsername = (newName || '').trim();
    if (newUsername.length < 3) {
      console.warn('Username must be at least 3 characters long');
      return;
    }
    setName(newUsername);
    const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', user.id);
    if (error) {
      console.error('Error updating profile:', error);
    }
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setName('');
  };

  const value = {
    session,
    user,
    loading,
    profileLoading,
    isPasswordRecovery,
    setIsPasswordRecovery, // Expose this to be called from ResetPassword page
    name,
    setName: updateProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  return useContext(AuthContext);
}
