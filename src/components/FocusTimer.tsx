import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Clock } from "lucide-react";

interface FocusTimerProps {
  sessionActive: boolean;
  initialSeconds?: number;
  onFocusUpdate?: (seconds: number) => void;
}

const FocusTimer = ({ sessionActive, initialSeconds = 0, onFocusUpdate }: FocusTimerProps) => {
  const [focusSeconds, setFocusSeconds] = useState(initialSeconds);
  const [isVisible, setIsVisible] = useState(true);
  const accumulatedRef = useRef(initialSeconds * 1000);
  const visibleSinceRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync accumulated base when the DB-saved value arrives (after loading)
  const seedAppliedRef = useRef(false);
  useEffect(() => {
    if (initialSeconds > 0 && !seedAppliedRef.current) {
      seedAppliedRef.current = true;
      accumulatedRef.current = initialSeconds * 1000;
      setFocusSeconds(initialSeconds);
    }
  }, [initialSeconds]);

  const getElapsed = useCallback(() => {
    let total = accumulatedRef.current;
    if (visibleSinceRef.current !== null) {
      total += Date.now() - visibleSinceRef.current;
    }
    return Math.floor(total / 1000);
  }, []);

  const updateDisplay = useCallback(() => {
    const secs = getElapsed();
    setFocusSeconds(secs);
    onFocusUpdate?.(secs);
  }, [getElapsed, onFocusUpdate]);

  const startTracking = useCallback(() => {
    if (visibleSinceRef.current !== null) return;
    visibleSinceRef.current = Date.now();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(updateDisplay, 500);
  }, [updateDisplay]);

  const stopTracking = useCallback(() => {
    if (visibleSinceRef.current !== null) {
      accumulatedRef.current += Date.now() - visibleSinceRef.current;
      visibleSinceRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setFocusSeconds(getElapsed());
  }, [getElapsed]);

  useEffect(() => {
    if (!sessionActive) {
      stopTracking();
      return;
    }

    const handleVisibility = () => {
      const visible = document.visibilityState === "visible";
      setIsVisible(visible);
      if (visible) startTracking();
      else stopTracking();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    if (document.visibilityState === "visible") startTracking();

    return () => {
      stopTracking();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [sessionActive, startTracking, stopTracking]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const status = !sessionActive ? "inactive" : isVisible ? "active" : "paused";
  const statusLabel = status === "active" ? "Focused" : status === "paused" ? "Paused" : "Inactive";
  const statusColor = status === "active" ? "bg-focus-active" : status === "paused" ? "bg-focus-paused" : "bg-focus-inactive";

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Focus Time</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-2.5 h-2.5 rounded-full ${statusColor}`}
            animate={status === "active" ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <span className="text-xs font-medium text-muted-foreground">{statusLabel}</span>
        </div>
      </div>

      <div className="text-center">
        <motion.div
          className={`inline-flex items-center justify-center w-28 h-28 rounded-full border-4 ${
            status === "active" ? "border-focus-active focus-pulse" : status === "paused" ? "border-focus-paused" : "border-focus-inactive"
          }`}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          <span className="font-display text-3xl font-bold">{formatTime(focusSeconds)}</span>
        </motion.div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
        {isVisible ? (
          <><Eye className="w-3.5 h-3.5" /> Tab active</>
        ) : (
          <><EyeOff className="w-3.5 h-3.5" /> Tab hidden — focus paused</>
        )}
      </div>
    </div>
  );
};

export default FocusTimer;
