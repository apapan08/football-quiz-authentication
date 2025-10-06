// src/pages/Lobby.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import supabase from '../lib/supabaseClient';
import useRoomChannel from '../hooks/useRoomChannel';
import { QUIZ_ID } from '../lib/quizVersion';

export default function Lobby() {
  const { code } = useParams();
  const nav = useNavigate();
  const { user, loading, name } = useSupabaseAuth();

  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(false);

  const [dbRoster, setDbRoster] = useState([]);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${(code || '').toUpperCase()}`
      : '';

  useEffect(() => {
    if (!loading && !name.trim()) {
      nav(`/join/${code}`, { replace: true });
    }
  }, [loading, name, code, nav]);

  // Fetch room (prefer current quiz), ensure I'm a participant
  useEffect(() => {
    if (loading || !user) return;

    (async () => {
      let q = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .eq('quiz_id', QUIZ_ID)
        .maybeSingle();

      let data = q.data;
      if (!data) {
        const fb = await supabase.from('rooms').select('*').eq('code', code).maybeSingle();
        data = fb.data;
      }
      if (!data) {
        alert('Room not found');
        nav('/');
        return;
      }

      setRoom(data);

      const up = await supabase.from('participants').upsert(
        {
          room_id: data.id,
          user_id: user.id,
          name: (name || 'Player').trim(),
          is_host: data.created_by === user.id,
        },
        { onConflict: 'room_id,user_id' }
      );
      if (up.error) console.error('participants upsert failed:', up.error);
    })();
  }, [loading, code, user, name, nav]);

  // Seed + realtime roster from participants
  useEffect(() => {
    if (!room?.id) return;
    let channel;

    (async () => {
      const { data } = await supabase
        .from('participants')
        .select('user_id,name,is_host')
        .eq('room_id', room.id);
      setDbRoster(data || []);

      channel = supabase
        .channel(`participants:${room.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${room.id}` },
          ({ eventType, new: n, old: o }) => {
            setDbRoster(prev => {
              const by = new Map(prev.map(p => [p.user_id, p]));
              if (eventType === 'INSERT' || eventType === 'UPDATE') {
                by.set(n.user_id, { user_id: n.user_id, name: n.name, is_host: n.is_host });
              }
              if (eventType === 'DELETE' && o?.user_id) by.delete(o.user_id);
              return Array.from(by.values());
            });
          }
        )
        .subscribe();
    })();

    return () => { try { channel?.unsubscribe(); } catch {} };
  }, [room?.id]);

  const isHost = useMemo(() => room && user && room.created_by === user.id, [room, user]);

  const { roster, broadcastStart } = useRoomChannel({
    code,
    user_id: user?.id,
    name: name || 'Player',
    is_host: isHost,
    onStart: ({ startedAt }) => { nav(`/play/${code}?t=${startedAt}`); },
  });

  const displayRoster = useMemo(() => {
    const by = new Map();
    dbRoster.forEach(p => by.set(p.user_id, { ...p }));
    roster.forEach(p => by.set(p.user_id, { ...by.get(p.user_id), ...p }));
    return Array.from(by.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [dbRoster, roster]);

  const canStart = isHost && displayRoster.filter((r) => !!r.name).length >= 2;

  async function startGame() {
    if (!room) return;
    const startedAt = Date.now();
    await supabase.from('rooms').update({ status: 'playing' }).eq('id', room.id);
    await broadcastStart({ startedAt });
    nav(`/play/${code}?t=${startedAt}`);
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(180deg,#223B57,#2F4E73)' }}>
      <div className="card w-full max-w-2xl text-slate-100">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-extrabold">Lobby</h1>
          <div className="pill bg-white/10">Code: <span className="font-mono">{(code || '').toUpperCase()}</span></div>
        </div>

        <div className="mt-4 text-sm text-slate-300 space-y-2">
          <div>Send this link to your friends:</div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input className="flex-1 min-w-0 rounded-2xl bg-slate-900/60 px-4 py-2.5 text-slate-200 outline-none ring-1 ring-white/10" readOnly value={shareUrl} />
            <button className="btn btn-neutral w-full sm:w-auto shrink-0" onClick={copyInvite}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Alternatively, give them the code: <span className="font-mono">{(code || '').toUpperCase()}</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {isHost
              ? (displayRoster.length < 2 ? 'Waiting for at least 2 players to start.' : 'When you are ready, press "Start Game".')
              : 'Waiting for the host to start the game.'}
          </div>
        </div>

        <ul className="mt-4 divide-y divide-white/10">
          {displayRoster.map((p) => (
            <li key={p.user_id} className="py-2 flex items-center justify-between">
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-slate-300">
                {p.is_host ? 'Host' : 'Player'} {p.finished ? '• Finished' : ''}
              </div>
            </li>
          ))}
          {displayRoster.length === 0 && <li className="py-4 text-slate-400">No one is here yet...</li>}
        </ul>

        <div className="mt-6 flex justify-between">
          <a className="btn btn-neutral" href="/">← Home</a>
          <button className="btn btn-accent disabled:opacity-60" disabled={!canStart} onClick={startGame}>Start Game</button>
        </div>
      </div>
    </div>
  );
}

