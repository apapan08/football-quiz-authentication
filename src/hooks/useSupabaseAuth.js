// src/hooks/useSupabaseAuth.js
import { useEffect, useState, useCallback } from 'react';
import supabase from '../lib/supabaseClient';

export function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  // Listen to auth changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // This should only be set to true by the PASSWORD_RECOVERY event
      // and reset to false manually after the password has been updated.
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Initial session load
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

  // Fetch profile when user changes
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

  return { session, user, loading, profileLoading, isPasswordRecovery, setIsPasswordRecovery, name, setName: updateProfile, signOut };
}
