// src/AppRouter.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSupabaseAuth } from "./hooks/useSupabaseAuth";
import Landing from "./pages/Landing.jsx";
import Lobby from "./pages/Lobby.jsx";
import PlayRoom from "./pages/PlayRoom.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Join from "./pages/Join.jsx";
import Solo from "./pages/Solo.jsx";
import Profile from "./pages/Profile.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

export default function AppRouter() {
  const { session, isPasswordRecovery } = useSupabaseAuth();

  // If the user is in the password recovery flow, show only that page.
  if (isPasswordRecovery && session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<ResetPassword />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/join/:code" element={<Join />} />
        <Route path="/room/:code" element={<Lobby />} />
        <Route path="/play/:code" element={<PlayRoom />} />
        <Route path="/room/:code/leaderboard" element={<Leaderboard />} />
        <Route path="/solo" element={<Solo />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
