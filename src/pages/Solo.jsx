// src/pages/Solo.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QuizPrototype from "../App.jsx";
import ResultsOverlayV2 from "../components/ResultsOverlayV2.jsx";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import supabase from "../lib/supabaseClient";
import { QUIZ_ID } from "../lib/quizVersion";

export default function Solo() {
  const nav = useNavigate();
  const { session, user, loading, profileLoading, name, setName } = useSupabaseAuth();
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayView, setOverlayView] = useState("global");
  const [refreshTick, setRefreshTick] = useState(0);
  const mySeedRowRef = useRef(null);

  useEffect(() => {
    if (!loading && !session) {
      nav('/', { replace: true });
    }
  }, [session, loading, nav]);

  async function upsertSoloRun({ score, maxStreak, durationSeconds }) {
    if (!user) return { ok: false };

    const payload = {
      user_id: user.id,
      name: name, // No longer need fallback
      score,
      max_streak: maxStreak,
      duration_seconds: durationSeconds,
      finished_at: new Date().toISOString(),
      quiz_id: QUIZ_ID,
    };

    // Check if a solo run for this user and quiz already exists
    const { data: existingRun, error: selectError } = await supabase
      .from('runs')
      .select('id')
      .is('room_id', null)
      .eq('user_id', user.id)
      .eq('quiz_id', QUIZ_ID)
      .maybeSingle();

    if (selectError) {
      console.error("[solo] select run failed:", selectError);
      return { ok: false, error: selectError };
    }

    let error;
    if (existingRun) {
      // If it exists, update it
      const { error: updateError } = await supabase
        .from('runs')
        .update({ ...payload, room_id: null })
        .eq('id', existingRun.id);
      error = updateError;
    } else {
      // If it doesn't exist, insert it
      const { error: insertError } = await supabase
        .from('runs')
        .insert({ ...payload, room_id: null });
      error = insertError;
    }

    if (error) {
      console.error("[solo] upsert runs failed:", error);
      return { ok: false, error };
    }
    return { ok: true };
  }

  async function onFinish({ score, maxStreak, durationSeconds }) {
    const res = await upsertSoloRun({ score, maxStreak, durationSeconds });
    if (!res.ok) {
      alert("Failed to save result (see console).");
      return;
    }

    mySeedRowRef.current = {
      user_id: user.id,
      name: name,
      score,
      max_streak: maxStreak,
      duration_seconds: durationSeconds,
      finished_at: new Date().toISOString(),
    };

    setRefreshTick((t) => t + 1);
    setOverlayView("global");
    setShowOverlay(true);
  }

  if (loading || profileLoading || !session) {
    return <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(180deg,#223B57,#2F4E73)' }}><p className="text-white">Loading Profile...</p></div>;
  }

  return (
    <>
      <QuizPrototype
        roomCode={null} // SOLO
        onFinish={onFinish}
        playerName={name || ""}
        onOpenOverlayRequest={() => {
          setOverlayView("global");
          setShowOverlay(true);
        }}
        startStage="intro" // For solo, we can skip the name stage as we have it from auth
        onNameSaved={setName}
      />

      {showOverlay && (
        <ResultsOverlayV2
          onClose={() => setShowOverlay(false)}
          roomCode={null} // SOLO
          youId={user.id}
          seedRow={mySeedRowRef.current}
          view={overlayView}
          onViewChange={(v) => setOverlayView(v)}
          refreshSignal={refreshTick}
        />
      )}
    </>
  );
}
