// src/pages/ResetPassword.jsx
import React, { useState } from 'react';
import supabase from '../lib/supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated successfully! You can now sign out and sign back in with your new password.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(180deg,#223B57,#2F4E73)' }}>
      <div className="card w-full max-w-lg text-slate-100">
        <h1 className="font-display text-3xl font-extrabold mb-4">Set a New Password</h1>
        <p className="text-slate-300 mb-6">You have been successfully authenticated. Please enter a new password for your account.</p>
        
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300">New Password</label>
            <input
              className="w-full rounded-2xl bg-slate-900/60 px-4 py-3 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-pink-400"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {message && <p className="text-green-400 text-sm">{message}</p>}

          <div className="pt-4">
            <button type="submit" className="btn btn-accent w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
