import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const PING_INTERVAL_MS = 10_000;

// Generate row letters A-Z for up to 26 rows
const ROW_LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
// Column numbers 1-20
const COL_NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

type Phase = "loading" | "enter" | "joined" | "left" | "error";

export default function DemoJoin() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  const [phase, setPhase] = useState<Phase>("loading");
  const [courseName, setCourseName] = useState("");
  const [selectedRow, setSelectedRow] = useState("A");
  const [selectedCol, setSelectedCol] = useState(1);
  const [deskLabel, setDeskLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seatIdRef = useRef<string | null>(null);
  const visibilityCleanupRef = useRef<(() => void) | null>(null);

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
        seatIdRef.current = existingId;
        const existingLabel = localStorage.getItem(`demo_label_${sessionId}`) ?? "";
        setDeskLabel(existingLabel);
        setPhase("joined");
        startPing(existingId);
        return;
      }

      setPhase("enter");
    };

    fetchSession();

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      visibilityCleanupRef.current?.();
    };
  }, [sessionId]);

  const startPing = (id: string) => {
    if (pingRef.current) clearInterval(pingRef.current);
    const ping = async () => {
      await supabase
        .from("demo_seats")
        .update({ last_ping: new Date().toISOString() })
        .eq("id", id);
    };
    ping();
    pingRef.current = setInterval(ping, PING_INTERVAL_MS);

    // Immediate visibility-based disconnect/reconnect signals
    const handleVisibility = async () => {
      if (document.visibilityState === "hidden") {
        // Immediately signal disconnect by clearing last_ping
        await supabase
          .from("demo_seats")
          .update({ last_ping: null })
          .eq("id", id);
      } else {
        // Immediately signal reconnect with a fresh ping
        ping();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    // Store cleanup ref
    visibilityCleanupRef.current = () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  };

  const handleLeave = async () => {
    if (!seatIdRef.current || !sessionId) return;
    setSubmitting(true);
    if (pingRef.current) clearInterval(pingRef.current);
    visibilityCleanupRef.current?.();
    await supabase.from("demo_seats").delete().eq("id", seatIdRef.current);
    localStorage.removeItem(`demo_seat_${sessionId}`);
    localStorage.removeItem(`demo_label_${sessionId}`);
    seatIdRef.current = null;
    setSubmitting(false);
    setPhase("left");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = `${selectedRow}${selectedCol}`;
    if (!sessionId) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("demo_seats")
      .insert({ session_id: sessionId, seat_label: label, last_ping: new Date().toISOString() })
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
    seatIdRef.current = data.id;
    setDeskLabel(label);
    setPhase("joined");
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
              <p className="mt-1 text-muted-foreground text-sm">Select your seat to join live</p>
            </div>

            {/* Seat picker */}
            <form onSubmit={handleJoin} className="flex flex-col gap-5">
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

              <Button type="submit" size="lg" disabled={submitting} className="h-14 text-base">
                {submitting ? "Joining…" : `Join as Seat ${selectedRow}${selectedCol}`}
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
            {/* Pulsing status indicator */}
            <div className="relative flex items-center justify-center w-20 h-20">
              <motion.div
                className="absolute w-20 h-20 rounded-full bg-focus-active/20"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="w-12 h-12 rounded-full bg-focus-active flex items-center justify-center shadow-lg">
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-1">
                Connected
              </p>
              <h1 className="font-display text-5xl font-bold text-foreground">
                Desk {deskLabel}
              </h1>
              <p className="mt-3 text-muted-foreground text-sm">{courseName}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <motion.div
                className="w-2 h-2 rounded-full bg-focus-active"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              Live · stay on this page
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
