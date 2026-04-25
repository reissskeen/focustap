import { useCallback, useEffect, useRef, useState } from "react";
import { focusGuard, type FocusEvent } from "@/services/focusGuard";
import { supabase } from "@/integrations/supabase/client";

interface UseFocusAuditOptions {
  sessionId: string | undefined;
  userId: string | undefined;
  enabled: boolean;
  countdownSeconds?: number;
}

export interface FocusAuditState {
  overlayActive: boolean;
  violationCount: number;
  totalBlurMs: number;
  focusScore: number;       // 0–100; 100 = no violations
  suspended: boolean;
  countdownSeconds: number;
  dismiss: () => void;
  onExpired: () => void;
  enterFullscreen: () => Promise<void>;
}

// 10 points deducted per hard violation (tab/window/fullscreen); floor at 0.
function computeScore(violations: number): number {
  return Math.max(0, 100 - violations * 10);
}

// Batch-sync events to Supabase every 60 s; also flushed on dismiss / expire / unmount.
const FLUSH_INTERVAL_MS = 60_000;

export function useFocusAudit({
  sessionId,
  userId,
  enabled,
  countdownSeconds = 10,
}: UseFocusAuditOptions): FocusAuditState {
  const [overlayActive, setOverlayActive] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [totalBlurMs, setTotalBlurMs] = useState(0);
  const [suspended, setSuspended] = useState(false);

  // Mutable refs so callbacks close over current values without re-registration.
  const violationCountRef = useRef(0);
  const totalBlurMsRef = useRef(0);
  const pendingRef = useRef<FocusEvent[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const focusScore = computeScore(violationCount);

  // ── Supabase flush ───────────────────────────────────────────────────────

  // Drains focusGuard's in-memory log into pendingRef then writes to Supabase.
  const flush = useCallback(async () => {
    if (!sessionId || !userId) return;

    // Drain the guard's buffer before flushing
    const guardEvents = focusGuard.getEvents();
    focusGuard.clearEvents();
    pendingRef.current.push(...guardEvents);

    const rows = pendingRef.current;
    if (rows.length === 0) return;
    pendingRef.current = [];

    await supabase.from("focus_events").insert(
      rows.map((e) => ({
        user_id: userId,
        session_id: sessionId,
        event_type: e.type,
        created_at: new Date(e.timestamp).toISOString(),
        duration_ms: e.durationMs ?? null,
      }))
    );

    // Push latest score to student_sessions so the professor sees it in real-time.
    const score = computeScore(violationCountRef.current);
    await supabase
      .from("student_sessions")
      .update({ focus_score: score })
      .eq("user_id", userId)
      .eq("session_id", sessionId);
  }, [sessionId, userId]);

  // ── Public actions ───────────────────────────────────────────────────────

  const dismiss = useCallback(() => {
    focusGuard.logDismissal();
    setOverlayActive(false);
    flush();
  }, [flush]);

  const onExpired = useCallback(async () => {
    focusGuard.logSuspension();
    setSuspended(true);
    setOverlayActive(false);

    if (sessionId && userId) {
      await supabase
        .from("student_sessions")
        .update({ suspended_at: new Date().toISOString(), focus_score: 0 })
        .eq("user_id", userId)
        .eq("session_id", sessionId);
    }

    await flush();
  }, [sessionId, userId, flush]);

  const enterFullscreen = useCallback(() => focusGuard.enterFullscreen(), []);

  // ── FocusGuard registration ──────────────────────────────────────────────

  useEffect(() => {
    if (!enabled || !sessionId || !userId) {
      focusGuard.stop();
      return;
    }

    const onViolation = () => {
      violationCountRef.current += 1;
      setViolationCount(violationCountRef.current);
      setOverlayActive(true);
    };

    const onRestore = () => {
      // Drain accumulated events (includes window_focus with durationMs) so we
      // can accumulate the blur time before the next periodic flush.
      const events = focusGuard.getEvents();
      focusGuard.clearEvents();
      pendingRef.current.push(...events);

      for (const e of events) {
        if (e.durationMs && e.type === "window_focus") {
          totalBlurMsRef.current += e.durationMs;
        }
      }
      setTotalBlurMs(totalBlurMsRef.current);
    };

    focusGuard.onViolation(onViolation);
    focusGuard.onRestore(onRestore);
    focusGuard.start();

    flushTimerRef.current = setInterval(flush, FLUSH_INTERVAL_MS);

    return () => {
      focusGuard.offViolation(onViolation);
      focusGuard.offRestore(onRestore);
      focusGuard.stop();
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      // Best-effort final flush — fire-and-forget on unmount.
      flush();
    };
  }, [enabled, sessionId, userId, flush]);

  return {
    overlayActive,
    violationCount,
    totalBlurMs,
    focusScore,
    suspended,
    countdownSeconds,
    dismiss,
    onExpired,
    enterFullscreen,
  };
}
