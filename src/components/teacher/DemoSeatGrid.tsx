import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface DemoSeat {
  id: string;
  seat_label: string;
  student_name: string | null;
  last_ping: string | null;
  joined_at: string;
}

interface DemoSeatGridProps {
  sessionId: string;
  rows?: number;
  cols?: number;
}

export type SeatStatus = "active" | "paused" | "disconnected";

export const getSeatStatus = (lastPing: string | null): SeatStatus => {
  if (!lastPing) return "disconnected";
  const age = (Date.now() - new Date(lastPing).getTime()) / 1000;
  if (age < 2) return "active";
  if (age < 4) return "paused";
  return "disconnected";
};

const statusConfig: Record<SeatStatus, { bg: string; ring: string; pulse: boolean; label: string }> = {
  active:       { bg: "bg-focus-active/15",  ring: "ring-focus-active",  pulse: true,  label: "Active" },
  paused:       { bg: "bg-focus-paused/20",  ring: "ring-focus-paused",  pulse: false, label: "Paused" },
  disconnected: { bg: "bg-destructive/15",   ring: "ring-destructive",   pulse: false, label: "Away" },
};

const dotColor: Record<SeatStatus, string> = {
  active:       "bg-focus-active",
  paused:       "bg-focus-paused",
  disconnected: "bg-destructive",
};

export interface SeatAlert {
  seat_label: string;
  status: SeatStatus;
  secondsAgo: number;
}

export default function DemoSeatGrid({ sessionId, rows = 5, cols = 5 }: DemoSeatGridProps) {
  const [seats, setSeats] = useState<DemoSeat[]>([]);
  const [tick, setTick] = useState(0);

  const fetchSeats = useCallback(async () => {
    const { data } = await supabase
      .from("demo_seats")
      .select("id, seat_label, student_name, last_ping, joined_at")
      .eq("session_id", sessionId) as { data: DemoSeat[] | null };
    if (data) setSeats(data);
  }, [sessionId]);

  // Re-render every 1s so status colours update live
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchSeats();

    const channel = supabase
      .channel(`demo-seats-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "demo_seats", filter: `session_id=eq.${sessionId}` },
        () => fetchSeats()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, fetchSeats]);

  // Build seat labels
  const seatLabels: string[] = [];
  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    for (let c = 1; c <= cols; c++) {
      seatLabels.push(`${rowLetter}${c}`);
    }
  }

  const seatMap = new Map<string, DemoSeat>();
  for (const s of seats) seatMap.set(s.seat_label, s);

  const activeCount = seats.filter((s) => getSeatStatus(s.last_ping) === "active").length;
  const pausedCount = seats.filter((s) => getSeatStatus(s.last_ping) === "paused").length;
  const disconnectedCount = seats.filter((s) => getSeatStatus(s.last_ping) === "disconnected").length;

  return (
    <div className="space-y-4">
      {/* Legend + live count */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-focus-active inline-block animate-pulse" /> Active ({activeCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-focus-paused inline-block" /> Paused ({pausedCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" /> Disconnected ({disconnectedCount})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-focus-active opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-focus-active"></span>
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Live · {seats.length} joined
          </span>
        </div>
      </div>

      {/* Grid */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {seatLabels.map((label, i) => {
          const seat = seatMap.get(label);
          const status = seat ? getSeatStatus(seat.last_ping) : null;
          const cfg = status ? statusConfig[status] : null;
          const secondsAgo = seat?.last_ping
            ? Math.round((Date.now() - new Date(seat.last_ping).getTime()) / 1000)
            : null;

          return (
            <motion.div
              key={label}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className={[
                "relative flex flex-col items-center justify-center rounded-lg aspect-square max-w-[64px]",
                "ring-1 transition-all duration-300 select-none",
                cfg
                  ? `${cfg.bg} ${cfg.ring}`
                  : "bg-muted/20 ring-border/40",
                status === "disconnected" && seat ? "animate-pulse" : "",
              ].join(" ")}
            >
              {/* Pulse ring for active */}
              {cfg?.pulse && (
                <motion.div
                  className="absolute inset-0 rounded-xl ring-1 ring-focus-active"
                  animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.06, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Warning flash for paused */}
              {status === "paused" && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-focus-paused/10"
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}

              {/* Seat label */}
              <span
                className={[
                  "font-mono font-bold leading-none",
                  seat ? "text-sm text-foreground" : "text-[10px] text-muted-foreground/40",
                ].join(" ")}
              >
                {label}
              </span>

              {/* Student name */}
              {seat?.student_name && (
                <span className="text-[8px] leading-tight text-muted-foreground truncate max-w-full px-0.5 mt-0.5">
                  {seat.student_name.split(" ")[0]}
                </span>
              )}

              {/* Status dot + seconds ago */}
              {status && (
                <div className="flex flex-col items-center mt-1">
                  <div className={`w-2 h-2 rounded-full ${dotColor[status]}`} />
                  {secondsAgo !== null && secondsAgo > 10 && (
                    <span className={`text-[9px] mt-0.5 font-mono ${
                      status === "disconnected" ? "text-destructive font-bold" : "text-muted-foreground"
                    }`}>
                      {secondsAgo}s
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {seats.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-6">
          No participants yet — share the NFC link to get started.
        </p>
      )}
    </div>
  );
}
