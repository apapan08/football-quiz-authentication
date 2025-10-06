// src/hooks/useSupabaseAuth.js
import { useEffect, useState, useCallback } from 'react';
import supabase from '../lib/supabaseClient';

export function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(null);

  const updateProfile = useCallback(async (newName) => {
    if (!user) return;
    const newUsername = (newName || '').trim();
    if (newUsername.length < 3) {
        // Or handle this with some UI feedback
        console.warn('Username must be at least 3 characters long');
        return;
    }
    setName(newUsername);
    const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', user.id);
    if (error) {
      console.error('Error updating profile:', error);
    }
  }, [user]);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const currentUser = session?.user;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', currentUser.id)
          .single();
        setName(profile?.username || '');
      }
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', currentUser.id)
          .single();
        setName(profile?.username || '');
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setName(null);
  };

  return { session, user, loading, name, setName: updateProfile, signOut };
}
