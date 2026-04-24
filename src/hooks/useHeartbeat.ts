import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseHeartbeatOptions {
  sessionId: string | undefined;
  userId: string | undefined;
  enabled: boolean;
  initialFocusSeconds?: number;
  intervalMs?: number;
}

export type ConnectionStatus = "connected" | "disconnected" | "idle";

export function useHeartbeat({
  sessionId,
  userId,
  enabled,
  initialFocusSeconds = 0,
  intervalMs = 5000,
}: UseHeartbeatOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [focusSeconds, setFocusSeconds] = useState(initialFocusSeconds);
  const [pauseCount, setPauseCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusRef = useRef(initialFocusSeconds);
  const initialFocusSecondsRef = useRef(initialFocusSeconds);
  const pauseCountRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatInFlightRef = useRef(false);
  const heartbeatFailuresRef = useRef(false);

  // Keep the ref in sync so the effect always reads the latest prop value
  initialFocusSecondsRef.current = initialFocusSeconds;

  const writeFocusEvent = useCallback(async (eventType: "start" | "pause" | "resume") => {
    if (!sessionId || !userId) return;
    await supabase.from("focus_events").insert({ user_id: userId, session_id: sessionId, event_type: eventType });
  }, [sessionId, userId]);

  const sendHeartbeat = useCallback(async () => {
    if (!sessionId || !userId) return;
    if (heartbeatInFlightRef.current) return;

    heartbeatInFlightRef.current = true;

    try {
      const { error } = await supabase
        .from("student_sessions")
        .update({
          last_heartbeat: new Date().toISOString(),
          focus_seconds: focusRef.current,
        })
        .eq("user_id", userId)
        .eq("session_id", sessionId);

      if (error) {
        heartbeatFailuresRef.current = true;
        setStatus((prev) => (prev === "disconnected" ? prev : "disconnected"));
      } else {
        heartbeatFailuresRef.current = false;
        setStatus((prev) => (prev === "connected" ? prev : "connected"));
      }
    } catch {
      heartbeatFailuresRef.current = true;
      setStatus((prev) => (prev === "disconnected" ? prev : "disconnected"));
    } finally {
      heartbeatInFlightRef.current = false;
    }
  }, [sessionId, userId]);

  // Send a final keepalive heartbeat (survives page unload)
  const sendFinalHeartbeat = useCallback(() => {
    if (!sessionId || !userId) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/student_sessions?user_id=eq.${userId}&session_id=eq.${sessionId}`;
    const body = JSON.stringify({
      last_heartbeat: new Date().toISOString(),
      focus_seconds: focusRef.current,
    });
    try {
      fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          Prefer: "return=minimal",
        },
        body,
        keepalive: true,
      });
    } catch {
      // best-effort
    }
  }, [sessionId, userId]);

  useEffect(() => {
    if (!enabled || !sessionId || !userId) {
      setStatus("idle");
      return;
    }

    // Restore focus counter from DB-saved value (handles page refresh)
    focusRef.current = initialFocusSecondsRef.current;
    setFocusSeconds(initialFocusSecondsRef.current);

    heartbeatFailuresRef.current = false;
    heartbeatInFlightRef.current = false;

    // Focus counter (1s tick, only when visible)
    const startFocusTick = () => {
      if (tickRef.current) return;
      tickRef.current = setInterval(() => {
        focusRef.current += 1;
        setFocusSeconds(focusRef.current);
      }, 1000);
    };

    const stopFocusTick = () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };

    const stopHeartbeat = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const startHeartbeat = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(sendHeartbeat, intervalMs);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        writeFocusEvent("resume");
        startFocusTick();
        startHeartbeat();
        sendHeartbeat(); // immediate resume heartbeat
      } else {
        writeFocusEvent("pause");
        pauseCountRef.current += 1;
        setPauseCount(pauseCountRef.current);
        stopFocusTick();
        stopHeartbeat();
        sendFinalHeartbeat(); // one last ping with keepalive
      }
    };

    const handlePageHide = () => {
      sendFinalHeartbeat();
    };

    // Start
    if (document.visibilityState === "visible") startFocusTick();
    writeFocusEvent("start");
    sendHeartbeat(); // immediate first heartbeat
    startHeartbeat();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      stopHeartbeat();
      stopFocusTick();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [enabled, sessionId, userId, sendHeartbeat, sendFinalHeartbeat, writeFocusEvent, intervalMs]);

  return { status, focusSeconds, pauseCount };
}
