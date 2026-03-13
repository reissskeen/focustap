import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Clock } from "lucide-react";

const PING_INTERVAL_MS = 1_000;

// Generate row letters A-Z for up to 26 rows
const ROW_LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
// Column numbers 1-20
const COL_NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

type Phase = "loading" | "enter" | "joined" | "left" | "removed" | "error";

export default function DemoJoin() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  const [phase, setPhase] = useState<Phase>("loading");
  const [courseName, setCourseName] = useState("");
  const [selectedRow, setSelectedRow] = useState("A");
  const [selectedCol, setSelectedCol] = useState(1);
  const [studentName, setStudentName] = useState("");
  const [deskLabel, setDeskLabel] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seatIdRef = useRef<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const pingInFlightRef = useRef(false);
  const pingFailuresRef = useRef(0);

  // Focus timer state
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const accumulatedMsRef = useRef(0);
  const visibleSinceRef = useRef<number | null>(null);
  const focusTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getElapsedSeconds = useCallback(() => {
    let total = accumulatedMsRef.current;
    if (visibleSinceRef.current !== null) {
      total += Date.now() - visibleSinceRef.current;
    }
    return Math.floor(total / 1000);
  }, []);

  const startFocusTimer = useCallback(() => {
    if (visibleSinceRef.current !== null) return;
    visibleSinceRef.current = Date.now();
    if (focusTickRef.current) clearInterval(focusTickRef.current);
    focusTickRef.current = setInterval(() => {
      setFocusSeconds(getElapsedSeconds());
    }, 500);
  }, [getElapsedSeconds]);

  const pauseFocusTimer = useCallback(() => {
    if (visibleSinceRef.current !== null) {
      accumulatedMsRef.current += Date.now() - visibleSinceRef.current;
      visibleSinceRef.current = null;
    }
    if (focusTickRef.current) {
      clearInterval(focusTickRef.current);
      focusTickRef.current = null;
    }
    setFocusSeconds(getElapsedSeconds());
  }, [getElapsedSeconds]);

  const resetFocusTimer = useCallback(() => {
    pauseFocusTimer();
    accumulatedMsRef.current = 0;
    setFocusSeconds(0);
  }, [pauseFocusTimer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Listen for teacher removing our seat via realtime
  useEffect(() => {
    if (!seatIdRef.current || phase !== "joined") return;
    const seatId = seatIdRef.current;

    const channel = supabase
      .channel(`my-seat-${seatId}`)
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "demo_seats", filter: `id=eq.${seatId}` },
        () => {
          // Teacher removed us
          if (pingRef.current) clearInterval(pingRef.current);
          cleanupRef.current?.();
          if (sessionId) {
            localStorage.removeItem(`demo_seat_${sessionId}`);
            localStorage.removeItem(`demo_label_${sessionId}`);
            localStorage.removeItem(`demo_name_${sessionId}`);
          }
          seatIdRef.current = null;
          setPhase("removed");
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [phase, sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setErrorMsg("No session ID in URL.");
      setPhase("error");
      return;
    }

    const fetchSession = async () => {
      const { data: session, error } = await supabase
        .from("sessions")
        .select("id, course_id, courses(name)")
        .eq("id", sessionId)
        .eq("status", "active")
        .maybeSingle();

      if (error || !session) {
        setErrorMsg("Session not found or has already ended.");
        setPhase("error");
        return;
      }

      const name = (session.courses as { name: string } | null)?.name ?? "Class";
      setCourseName(name);

      const existingId = localStorage.getItem(`demo_seat_${sessionId}`);
      if (existingId) {
        // Verify the seat still exists (teacher may have removed it)
        const { data: seatCheck } = await supabase
          .from("demo_seats")
          .select("id")
          .eq("id", existingId)
          .maybeSingle();

        if (!seatCheck) {
          // Seat was removed by teacher
          localStorage.removeItem(`demo_seat_${sessionId}`);
          localStorage.removeItem(`demo_label_${sessionId}`);
          localStorage.removeItem(`demo_name_${sessionId}`);
          setPhase("enter");
          return;
        }

        seatIdRef.current = existingId;
        const existingLabel = localStorage.getItem(`demo_label_${sessionId}`) ?? "";
        const existingName = localStorage.getItem(`demo_name_${sessionId}`) ?? "";
        setDeskLabel(existingLabel);
        setDisplayName(existingName);
        setPhase("joined");
        startFocusTimer();
        startPing(existingId);
        return;
      }

      setPhase("enter");
    };

    fetchSession();

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      cleanupRef.current?.();
    };
  }, [sessionId]);

  const startPing = (id: string) => {
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }

    pingInFlightRef.current = false;
    pingFailuresRef.current = 0;

    const ping = async () => {
      if (pingInFlightRef.current) return;

      pingInFlightRef.current = true;
      try {
        const { error } = await supabase
          .from("demo_seats")
          .update({ last_ping: new Date().toISOString(), focus_seconds: getElapsedSeconds() } as any)
          .eq("id", id);

        if (error) {
          pingFailuresRef.current += 1;
        } else {
          pingFailuresRef.current = 0;
        }
      } finally {
        pingInFlightRef.current = false;
      }
    };

    const startPingInterval = () => {
      if (pingRef.current) {
        clearInterval(pingRef.current);
      }
      pingRef.current = setInterval(() => {
        void ping();
      }, PING_INTERVAL_MS);
    };

    void ping();
    startPingInterval();

    // Build REST headers once for keepalive requests
    const restUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/demo_seats?id=eq.${id}`;
    const restHeaders: Record<string, string> = {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };

    // Send a final focus_seconds snapshot (keepalive) — does NOT null last_ping
    // so the teacher dashboard sees the age grow naturally via the 1s tick
    const sendFinalPing = () => {
      const body = JSON.stringify({
        last_ping: new Date().toISOString(),
        focus_seconds: getElapsedSeconds(),
      });
      fetch(restUrl, { method: "PATCH", headers: restHeaders, body, keepalive: true }).catch(() => {});
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        // Stop pinging — the age of last_ping will grow, naturally moving to paused → disconnected
        if (pingRef.current) {
          clearInterval(pingRef.current);
          pingRef.current = null;
        }
        sendFinalPing();
        pauseFocusTimer();
        setIsTabVisible(false);
      } else {
        // Resume pinging immediately
        void ping();
        startPingInterval();
        startFocusTimer();
        setIsTabVisible(true);
      }
    };

    // On true page close / swipe-kill, send one last snapshot
    const handlePageHide = () => sendFinalPing();
    const handleBeforeUnload = () => sendFinalPing();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    cleanupRef.current = () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  };

  const handleLeave = async () => {
    if (!seatIdRef.current || !sessionId) return;
    setSubmitting(true);
    if (pingRef.current) clearInterval(pingRef.current);
    cleanupRef.current?.();
    await supabase.from("demo_seats").delete().eq("id", seatIdRef.current);
    localStorage.removeItem(`demo_seat_${sessionId}`);
    localStorage.removeItem(`demo_label_${sessionId}`);
    localStorage.removeItem(`demo_name_${sessionId}`);
    seatIdRef.current = null;
  setSubmitting(false);
    resetFocusTimer();
    setPhase("left");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = studentName.trim();
    if (!trimmedName) return;
    const label = `${selectedRow}${selectedCol}`;
    if (!sessionId) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("demo_seats")
      .insert({ session_id: sessionId, seat_label: label, student_name: trimmedName, last_ping: new Date().toISOString() } as any)
      .select("id")
      .single();

    setSubmitting(false);

    if (error || !data) {
      setErrorMsg("Failed to join session. Please try again.");
      setPhase("error");
      return;
    }

    localStorage.setItem(`demo_seat_${sessionId}`, data.id);
    localStorage.setItem(`demo_label_${sessionId}`, label);
    localStorage.setItem(`demo_name_${sessionId}`, trimmedName);
    seatIdRef.current = data.id;
    setDeskLabel(label);
    setDisplayName(trimmedName);
    setPhase("joined");
    resetFocusTimer();
    startFocusTimer();
    startPing(data.id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">Loading session…</p>
          </motion.div>
        )}

        {phase === "enter" && (
          <motion.div
            key="enter"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-sm flex flex-col gap-6"
          >
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                <span className="text-3xl">🎓</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">{courseName}</h1>
            <p className="mt-1 text-muted-foreground text-sm">Enter your name and select your seat</p>
            </div>

            {/* Seat picker */}
            <form onSubmit={handleJoin} className="flex flex-col gap-5">
              {/* Name input */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Name</Label>
                <Input
                  type="text"
                  placeholder="First and Last Name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  maxLength={100}
                  required
                  className="h-12 text-base"
                  autoFocus
                />
              </div>
              {/* Preview */}
              <div className="flex items-center justify-center">
                <div className="bg-primary/10 border border-primary/30 rounded-2xl px-8 py-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Seat</p>
                  <p className="font-mono font-bold text-5xl text-primary">{selectedRow}{selectedCol}</p>
                </div>
              </div>

              {/* Row selector (letters) */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Row (letter)</Label>
                <div className="grid grid-cols-6 gap-1.5">
                  {ROW_LETTERS.slice(0, 10).map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setSelectedRow(letter)}
                      className={[
                        "h-10 rounded-lg font-mono font-bold text-sm transition-all",
                        selectedRow === letter
                          ? "bg-primary text-primary-foreground shadow-md scale-105"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted",
                      ].join(" ")}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column selector (numbers) */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Column (number)</Label>
                <div className="grid grid-cols-6 gap-1.5">
                  {COL_NUMBERS.slice(0, 12).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedCol(num)}
                      className={[
                        "h-10 rounded-lg font-mono font-bold text-sm transition-all",
                        selectedCol === num
                          ? "bg-primary text-primary-foreground shadow-md scale-105"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted",
                      ].join(" ")}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" size="lg" disabled={submitting || !studentName.trim()} className="h-14 text-base">
                {submitting ? "Joining…" : `Join as ${studentName.trim() || "…"} · Seat ${selectedRow}${selectedCol}`}
              </Button>
            </form>
          </motion.div>
        )}


        {phase === "joined" && (
          <motion.div
            key="joined"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
          >
            {/* Desk info - compact at top */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-3 h-3 rounded-full bg-focus-active"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Connected
                </p>
              </div>
              <h1 className="font-display text-4xl font-bold text-foreground">
                Desk {deskLabel}
              </h1>
              {displayName && (
                <p className="text-base font-medium text-foreground">{displayName}</p>
              )}
              <p className="text-muted-foreground text-xs">{courseName}</p>
            </div>

            {/* Focus Timer - hero element */}
            <div className="w-full flex flex-col items-center gap-4">
              <motion.div
                className={`relative inline-flex items-center justify-center w-36 h-36 rounded-full border-[5px] ${
                  isTabVisible ? "border-focus-active" : "border-focus-paused"
                }`}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                {/* Pulse ring behind timer when active */}
                {isTabVisible && (
                  <motion.div
                    className="absolute inset-[-6px] rounded-full border-2 border-focus-active/40"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <span className="font-mono text-4xl font-bold text-foreground">{formatTime(focusSeconds)}</span>
              </motion.div>

              <div className="flex items-center gap-2">
                <motion.div
                  className={`w-2.5 h-2.5 rounded-full ${isTabVisible ? "bg-focus-active" : "bg-focus-paused"}`}
                  animate={isTabVisible ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {isTabVisible ? "Focus Tracking" : "Paused — come back!"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {isTabVisible ? (
                  <><Eye className="w-3.5 h-3.5" /> Stay on this page to build your score</>
                ) : (
                  <><EyeOff className="w-3.5 h-3.5" /> Tab hidden — timer paused</>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              disabled={submitting}
              onClick={handleLeave}
              className="mt-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              {submitting ? "Leaving…" : "Leave Session"}
            </Button>
          </motion.div>
        )}

        {phase === "left" && (
          <motion.div
            key="left"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center max-w-xs"
          >
            <div className="text-4xl">👋</div>
            <h2 className="font-display text-xl font-bold text-foreground">You've left the session</h2>
            <p className="text-muted-foreground text-sm">Your teacher has been notified. You can close this page.</p>
          </motion.div>
        )}

        {phase === "removed" && (
          <motion.div
            key="removed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center max-w-xs"
          >
            <div className="text-4xl">🚫</div>
            <h2 className="font-display text-xl font-bold text-foreground">You've been removed</h2>
            <p className="text-muted-foreground text-sm">Your teacher removed you from the session. You can close this page.</p>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center max-w-xs"
          >
            <div className="text-4xl">⚠️</div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Couldn't join
            </h2>
            <p className="text-muted-foreground text-sm">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
