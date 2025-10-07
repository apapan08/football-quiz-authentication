// src/components/Auth.jsx
import React, { useState } from 'react';
import supabase from '../lib/supabaseClient';

const EyeIcon = ({ closed }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    {closed ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    )}
  </svg>
);

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const clearForm = () => {
    setError('');
    setMessage('');
  }

  const handleSignUp = async (e) => {
    e.preventDefault();
    clearForm();

    if (password !== repeatPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
        email, 
        password,
        options: {
            data: { username: username.trim() }
        }
    });

    if (error) {
      setError(error.message);
      if (error.message.includes('already registered')) {
        setError('Email is already registered. Please try logging in.');
      }
    } else {
      setMessage('Success! Please check your email for the confirmation link.');
    }
    setLoading(false);
  };

  const handleLogIn = async (e) => {
    e.preventDefault();
    clearForm();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    }
    // On success, the onAuthStateChange listener will handle the UI update
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    clearForm();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('If an account exists for this email, a password reset link has been sent.');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center text-white mb-4">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
      
      <form onSubmit={isSignUp ? handleSignUp : handleLogIn} className="space-y-4">
        {isSignUp && (
            <div>
                <label className="block text-sm text-slate-300">Username</label>
                <input
                    className="w-full rounded-2xl bg-slate-900/60 px-4 py-3 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-pink-400"
                    type="text"
                    placeholder="e.g., TheGOAT"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>
        )}
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
        
        <div className="relative">
          <label className="block text-sm text-slate-300">Password</label>
          <input
            className="w-full rounded-2xl bg-slate-900/60 px-4 py-3 pr-10 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-pink-400"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 flex items-center px-3 text-slate-400 hover:text-slate-200">
            <EyeIcon closed={showPassword} />
          </button>
        </div>

        {isSignUp && (
          <div className="relative">
            <label className="block text-sm text-slate-300">Repeat Password</label>
            <input
              className="w-full rounded-2xl bg-slate-900/60 px-4 py-3 pr-10 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-pink-400"
              type={showRepeatPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowRepeatPassword(!showRepeatPassword)} className="absolute inset-y-0 right-0 top-6 flex items-center px-3 text-slate-400 hover:text-slate-200">
                <EyeIcon closed={showRepeatPassword} />
            </button>
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {message && <p className="text-green-400 text-sm">{message}</p>}

        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            className="btn btn-accent w-full"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </div>
      </form>

      {!isSignUp && (
        <div className="mt-4">
          <button onClick={handlePasswordReset} className="btn btn-neutral w-full">
              Forgot password?
          </button>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-300 mb-2">
            {isSignUp ? 'Returning player?' : 'First time here?'}
        </p>
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            clearForm();
          }}
          className="btn btn-neutral w-full"
        >
          {isSignUp ? 'Log In' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
}
