// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

export default function Profile() {
  const nav = useNavigate();
  const { user, loading, name, setName, signOut } = useSupabaseAuth();
  const [newUsername, setNewUsername] = useState(name || '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      nav('/', { replace: true });
    } else {
      setNewUsername(name || '');
    }
  }, [user, loading, name, nav]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('Saving...');
    try {
      await setName(newUsername);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(180deg,#223B57,#2F4E73)' }}><p className="text-white">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(180deg,#223B57,#2F4E73)' }}>
      <div className="card w-full max-w-lg text-slate-100">
        <h1 className="font-display text-3xl font-extrabold mb-4">Your Profile</h1>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300">Email</label>
            <input
              className="w-full rounded-2xl bg-slate-800/60 px-4 py-3 text-slate-400 outline-none ring-1 ring-white/10"
              type="email"
              value={user.email}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300">Username</label>
            <input
              className="w-full rounded-2xl bg-slate-900/60 px-4 py-3 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-pink-400"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
            />
          </div>

          {message && <p className="text-green-400 text-sm">{message}</p>}

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
            <button type="button" onClick={() => nav('/')} className="btn btn-neutral w-full sm:w-auto">Back to Lobby</button>
            <button type="submit" className="btn btn-accent w-full sm:w-auto">Save Changes</button>
          </div>
        </form>

      </div>
    </div>
  );
}
