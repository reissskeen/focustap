import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseHeartbeatOptions {
  sessionId: string | undefined;
  userId: string | undefined;
  enabled: boolean;
  intervalMs?: number;
}

export type ConnectionStatus = "connected" | "disconnected" | "idle";

export function useHeartbeat({
  sessionId,
  userId,
  enabled,
  intervalMs = 1000,
}: UseHeartbeatOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [focusSeconds, setFocusSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatInFlightRef = useRef(false);
  const heartbeatFailuresRef = useRef(0);

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
        heartbeatFailuresRef.current += 1;
        if (heartbeatFailuresRef.current >= 2) {
          setStatus((prev) => (prev === "disconnected" ? prev : "disconnected"));
        }
      } else {
        heartbeatFailuresRef.current = 0;
        setStatus((prev) => (prev === "connected" ? prev : "connected"));
      }
    } catch {
      heartbeatFailuresRef.current += 1;
      if (heartbeatFailuresRef.current >= 2) {
        setStatus((prev) => (prev === "disconnected" ? prev : "disconnected"));
      }
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

    heartbeatFailuresRef.current = 0;
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
        startFocusTick();
        startHeartbeat();
        sendHeartbeat(); // immediate resume heartbeat
      } else {
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
  }, [enabled, sessionId, userId, sendHeartbeat, sendFinalHeartbeat, intervalMs]);

  return { status, focusSeconds };
}
