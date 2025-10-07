// src/pages/Landing.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../lib/supabaseClient';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { generateUniqueRoomCode } from '../lib/roomCode';
import { QUIZ_ID } from '../lib/quizVersion';
import Auth from '../components/Auth';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function Landing() {
  const nav = useNavigate();
  const query = useQuery();
  const { session, user, loading, profileLoading, name, signOut } = useSupabaseAuth();
  const [code, setCode] = useState('');

  useEffect(() => {
    if (session) {
      const redirectUrl = query.get('redirect');
      if (redirectUrl) {
        nav(redirectUrl, { replace: true });
      }
    }
  }, [session, query, nav]);

  async function createRoom() {
    if (!user) return;
    if (!name || !name.trim()) { alert('You must have a username to create a room. Please set one on your profile page.'); return; }

    const roomCode = await generateUniqueRoomCode();
    const { data: room, error: e1 } = await supabase
      .from('rooms')
      .insert({
        code: roomCode,
        created_by: user.id,
        status: 'lobby',
        settings: {},
        quiz_id: QUIZ_ID,
      })
      .select('*')
      .single();

    if (e1 || !room) { alert(e1?.message || 'Failed to create room'); return; }

    await supabase
      .from('participants')
      .upsert({ room_id: room.id, user_id: user.id, name, is_host: true }, { onConflict: 'room_id,user_id' });

    nav(`/room/${room.code}`);
  }

  async function joinRoom() {
    if (!user) return;

    const c = (code || '').trim().toUpperCase();
    if (!c || c.length !== 5) { alert('Valid 5-letter code required'); return; }
    if (!name || !name.trim()) { alert('You must have a username to join a room. Please set one on your profile page.'); return; }

    let { data: room, error } = await supabase.from('rooms').select('*').eq('code', c).eq('quiz_id', QUIZ_ID).maybeSingle();
    if (!room) {
      const fallback = await supabase.from('rooms').select('*').eq('code', c).maybeSingle();
      room = fallback.data; error = fallback.error;
    }
    if (error || !room) { alert('Room not found'); return; }

    await supabase
      .from('participants')
      .upsert({ room_id: room.id, user_id: user.id, name, is_host: false }, { onConflict: 'room_id,user_id' });

    nav(`/room/${room.code}`);
  }

  if (loading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(180deg,#223B57,#2F4E73)' }}><p className="text-white">Loading Profile...</p></div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(180deg,#223B57,#2F4E73)' }}>
        <div className="card w-full max-w-3xl text-slate-100">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-center">Football Quiz</h1>
          <p className="mt-2 text-center text-slate-300">Sign in to create or join a game.</p>
          <div className="mt-6">
            <Auth />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'linear-gradient(180deg,#223B57,#2F4E73)' }}
    >
      <div className="card w-full max-w-2xl text-slate-100 p-6 sm:p-8">
        {/* --- Header --- */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-center sm:text-left">Welcome, {name || 'Player'}!</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={() => nav('/profile')} className="btn btn-neutral flex-1 sm:flex-initial font-semibold">Profile</button>
            <button onClick={signOut} className="btn btn-neutral flex-1 sm:flex-initial font-semibold">Sign Out</button>
          </div>
        </div>

        {/* --- Multiplayer Actions --- */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <button className="btn btn-accent w-full sm:w-auto" onClick={createRoom} disabled={!name || !name.trim()}>
            Create Room
          </button>

          <div className="flex-1 min-w-0">
            <input
              className="w-full rounded-2xl bg-slate-900/60 px-4 py-3 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-pink-400 uppercase"
              placeholder="ROOM CODE (e.g., ABCDE)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
              maxLength={5}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <button className="btn btn-neutral w-full sm:w-auto shrink-0 whitespace-nowrap" onClick={joinRoom} disabled={!name || !name.trim() || code.trim().length !== 5}>
            Join
          </button>
        </div>

        {/* --- Separator --- */}
        <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
                <span className="bg-slate-900 px-2 text-sm text-slate-400">Or</span>
            </div>
        </div>

        {/* --- Solo Action --- */}
        <div>
            <a href="/solo" className="btn btn-neutral w-full font-semibold">Play Solo Mode</a>
        </div>

      </div>
    </div>
  );
}
