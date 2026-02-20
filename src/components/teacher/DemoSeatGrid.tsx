import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface DemoSeat {
  id: string;
  seat_label: string;
  last_ping: string | null;
  joined_at: string;
}

interface DemoSeatGridProps {
  sessionId: string;
  rows?: number;
  cols?: number;
}

type SeatStatus = "active" | "paused" | "disconnected";

const getSeatStatus = (lastPing: string | null): SeatStatus => {
  if (!lastPing) return "disconnected";
  const age = (Date.now() - new Date(lastPing).getTime()) / 1000;
  if (age < 20) return "active";
  if (age < 45) return "paused";
  return "disconnected";
};

const statusConfig: Record<SeatStatus, { bg: string; ring: string; pulse: boolean; label: string }> = {
  active:       { bg: "bg-focus-active/15",  ring: "ring-focus-active",  pulse: true,  label: "Active" },
  paused:       { bg: "bg-focus-paused/15",  ring: "ring-focus-paused",  pulse: false, label: "Paused" },
  disconnected: { bg: "bg-muted/40",         ring: "ring-muted",         pulse: false, label: "Away" },
};

const dotColor: Record<SeatStatus, string> = {
  active:       "bg-focus-active",
  paused:       "bg-focus-paused",
  disconnected: "bg-muted-foreground/40",
};

export default function DemoSeatGrid({ sessionId, rows = 5, cols = 6 }: DemoSeatGridProps) {
  const [seats, setSeats] = useState<DemoSeat[]>([]);
  const [tick, setTick] = useState(0);
  const totalSeats = rows * cols;

  const fetchSeats = useCallback(async () => {
    const { data } = await supabase
      .from("demo_seats")
      .select("id, seat_label, last_ping, joined_at")
      .eq("session_id", sessionId);
    if (data) setSeats(data);
  }, [sessionId]);

  // Re-render every 5s so status colours update live
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
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

  // Build seat labels: A1, A2... B1, B2...
  const seatLabels: string[] = [];
  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r); // A, B, C...
    for (let c = 1; c <= cols; c++) {
      seatLabels.push(`${rowLetter}${c}`);
    }
  }

  // Map seat_label → seat data
  const seatMap = new Map<string, DemoSeat>();
  for (const s of seats) seatMap.set(s.seat_label, s);

  const activeCount = seats.filter((s) => getSeatStatus(s.last_ping) === "active").length;

  return (
    <div className="space-y-4">
      {/* Legend + count */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-focus-active inline-block" /> Active</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-focus-paused inline-block" /> Paused</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40 inline-block" /> Away / Empty</span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {activeCount} / {seats.length} active · {seats.length} joined
        </span>
      </div>

      {/* Grid — fixed columns based on `cols` prop */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {seatLabels.map((label, i) => {
          const seat = seatMap.get(label);
          const status = seat ? getSeatStatus(seat.last_ping) : null;
          const cfg = status ? statusConfig[status] : null;

          return (
            <motion.div
              key={label}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className={[
                "relative flex flex-col items-center justify-center rounded-xl aspect-square",
                "ring-1 transition-all duration-500 select-none",
                cfg
                  ? `${cfg.bg} ${cfg.ring}`
                  : "bg-muted/20 ring-border/40",
              ].join(" ")}
            >
              {/* Pulse ring for active */}
              {cfg?.pulse && (
                <motion.div
                  className="absolute inset-0 rounded-xl ring-1 ring-focus-active"
                  animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Seat label */}
              <span
                className={[
                  "font-mono font-bold leading-none",
                  seat ? "text-base text-foreground" : "text-xs text-muted-foreground/40",
                ].join(" ")}
              >
                {label}
              </span>

              {/* Status dot */}
              {status && (
                <div className={`mt-1 w-2 h-2 rounded-full ${dotColor[status]}`} />
              )}
            </motion.div>
          );
        })}
      </div>

      {seats.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-6">
          No demo participants yet — share the Demo QR code to get started.
        </p>
      )}
    </div>
  );
}
