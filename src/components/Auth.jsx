// src/components/Auth.jsx
import React, { useState } from 'react';
import supabase from '../lib/supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // The onAuthStateChange listener in useSupabaseAuth will handle the redirect/UI update
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300">Email</label>
          <input
            className="w-full rounded-2xl bg-slate-900/60 px-4 py-3 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-pink-400"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300">Password</label>
          <input
            className="w-full rounded-2xl bg-slate-900/60 px-4 py-3 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-pink-400"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            className="btn btn-accent w-full"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn btn-neutral w-full"
            disabled={loading}
          >
            {loading ? '...' : 'Sign In with Google'}
          </button>
        </div>
      </form>
      <div className="mt-4 text-center text-sm text-slate-300">
        Don't have an account?{' '}
        <button
          onClick={async () => {
            if (!email || !password) {
              alert('Please enter email and password to sign up.');
              return;
            }
            try {
              setLoading(true);
              const { error } = await supabase.auth.signUp({ email, password });
              if (error) throw error;
              alert('Check your email for the confirmation link!');
            } catch (error) {
              alert(error.error_description || error.message);
            } finally {
              setLoading(false);
            }
          }}
          className="underline"
          disabled={loading}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
