// src/components/AuthProvider.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../hooks/useSupabaseAuth';
import supabase from '../lib/supabaseClient';

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
      } else if (event !== 'USER_UPDATED') {
        // Avoid resetting on profile updates
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
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Error fetching profile:', error);
          }
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
      throw new Error('Username must be at least 3 characters long.');
    }
    
    const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', user.id);
    if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
            throw new Error('This username is already taken.');
        }
        throw error;
    }
    // If successful, update local state
    setName(newUsername);
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setName('');
    setIsPasswordRecovery(false);
  };

  const value = {
    session,
    user,
    loading,
    profileLoading,
    isPasswordRecovery,
    setIsPasswordRecovery,
    name,
    setName: updateProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
