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
  intervalMs = 12000, // ~12s, within the 10-15s range
}: UseHeartbeatOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [focusSeconds, setFocusSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(document.visibilityState === "visible");

  const sendHeartbeat = useCallback(async () => {
    if (!sessionId || !userId) return;
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
        setStatus("disconnected");
      } else {
        setStatus("connected");
      }
    } catch {
      setStatus("disconnected");
    }
  }, [sessionId, userId]);

  // Log focus events
  const logFocusEvent = useCallback(
    async (eventType: "start" | "pause" | "resume") => {
      if (!sessionId || !userId) return;
      await supabase.from("focus_events").insert({
        user_id: userId,
        session_id: sessionId,
        event_type: eventType,
      });
    },
    [sessionId, userId]
  );

  useEffect(() => {
    if (!enabled || !sessionId || !userId) {
      setStatus("idle");
      return;
    }

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

    const handleVisibility = () => {
      const visible = document.visibilityState === "visible";
      isVisibleRef.current = visible;
      if (visible) {
        startFocusTick();
        logFocusEvent("resume");
      } else {
        stopFocusTick();
        logFocusEvent("pause");
      }
    };

    // Start
    logFocusEvent("start");
    if (document.visibilityState === "visible") startFocusTick();
    sendHeartbeat(); // immediate first heartbeat

    intervalRef.current = setInterval(sendHeartbeat, intervalMs);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopFocusTick();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, sessionId, userId, sendHeartbeat, intervalMs, logFocusEvent]);

  return { status, focusSeconds };
}
