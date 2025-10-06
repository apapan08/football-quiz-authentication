// src/pages/Join.jsx
import React, { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import supabase from '../lib/supabaseClient';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { QUIZ_ID } from '../lib/quizVersion';

export default function Join() {
  const { code } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const { session, user, loading, name, setName } = useSupabaseAuth();

  useEffect(() => {
    if (loading) return; // Wait until auth state is confirmed

    if (!session || !user) {
      // If user is not logged in, redirect to landing page to log in.
      // Pass the current path as a redirect target.
      nav(`/?redirect=${location.pathname}`, { replace: true });
      return;
    }

    if (!name.trim()) {
        // If user is logged in but has no name, stay on a simplified join page
        // to force them to set a name before proceeding.
        return;
    }

    (async () => {
      try {
        let { data: room } = await supabase
          .from('rooms').select('*')
          .eq('code', (code || '').toUpperCase())
          .eq('quiz_id', QUIZ_ID)
          .maybeSingle();

        if (!room) {
          const fb = await supabase.from('rooms').select('*')
            .eq('code', (code || '').toUpperCase())
            .maybeSingle();
          room = fb.data;
        }

        if (!room) { alert('Room not found'); nav('/'); return; }

        const { error: upErr } = await supabase.from('participants').upsert(
          { room_id: room.id, user_id: user.id, name: name, is_host: room.created_by === user.id },
          { onConflict: 'room_id,user_id' }
        );
        if (upErr) { console.error(upErr); alert('Failed to join room'); return; }

        nav(`/room/${room.code}`);
      } catch (e) {
        console.error(e);
        alert('An error occurred.');
      }
    })();
  }, [session, user, loading, name, code, nav, location.pathname]);

  if (loading || (session && name.trim())) {
    // Show loading text while checking auth or automatically joining
    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(180deg,#223B57,#2F4E73)' }}>
            <p className="text-white">Joining room...</p>
        </div>
    );
  }

  // Simplified form for a logged-in user who is missing a name
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(180deg,#223B57,#2F4E73)' }}
    >
      <div className="card w-full max-w-lg text-slate-100">
        <h1 className="font-display text-2xl font-extrabold">Set Your Display Name</h1>
        <p className="text-slate-300 mt-2">You need a display name to join the room.</p>
        <div className="mt-6 space-y-3">
          <label className="block text-sm text-slate-300">Display Name</label>
          <input
            className="w-full rounded-xl bg-slate-900/60 px-4 py-3 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-pink-400"
            placeholder="e.g., Goat"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            autoFocus
          />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            className="btn btn-accent w-full sm:w-auto"
            disabled={!name.trim()}
            onClick={() => {
                // The useEffect will re-run and proceed once the name is set
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
