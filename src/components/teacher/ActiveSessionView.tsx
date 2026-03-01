import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Clock, BarChart3, Download, Eye, Pause, UserCheck, LayoutGrid, List, ExternalLink, Smartphone, Copy,
  AlertTriangle, WifiOff, UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import {
  getActivityStatus,
  getAttendanceStatus,
  exportRosterCSV,
  type StudentActivityStatus,
  type AttendanceStatus,
} from "./AttendanceHelpers";
import DemoSeatGrid, { getSeatStatus } from "./DemoSeatGrid";

// --- Types ---

interface RosterStudent {
  id: string;
  user_id: string;
  display_name: string;
  focus_seconds: number;
  joined_at: string;
  last_heartbeat: string | null;
}

interface DemoSeatRow {
  id: string;
  seat_label: string;
  student_name: string | null;
  last_ping: string | null;
  focus_seconds: number;
}

interface ActiveSessionViewProps {
  session: Tables<"sessions">;
  course: Tables<"courses">;
  onSessionEnded: () => void;
}

// --- Helpers ---

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

const StatusDot = ({ status }: { status: StudentActivityStatus }) => {
  const color =
    status === "active" ? "bg-focus-active" :
    status === "paused" ? "bg-focus-paused" :
    "bg-destructive";
  return <div className={`w-2.5 h-2.5 rounded-full ${color} ${status === "active" ? "animate-pulse" : ""}`} />;
};

const AttendanceBadge = ({ status }: { status: AttendanceStatus }) => {
  const config = {
    present: "bg-focus-active/15 text-focus-active",
    late: "bg-focus-paused/15 text-focus-paused",
    absent: "bg-destructive/15 text-destructive",
  }[status];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config} capitalize`}>
      {status}
    </span>
  );
};

// --- Main Component ---

const ActiveSessionView = ({ session, course, onSessionEnded }: ActiveSessionViewProps) => {
  const [showNFC, setShowNFC] = useState(false);
  const [viewMode, setViewMode] = useState<"seats" | "roster">("seats");
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [demoSeats, setDemoSeats] = useState<DemoSeatRow[]>([]);
  const [ending, setEnding] = useState(false);
  const [gridRows, setGridRows] = useState(5);
  const [gridCols, setGridCols] = useState(5);
  const [tick, setTick] = useState(0);

  // 1-second tick for live alert updates
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch roster (authenticated students)
  const fetchRoster = async () => {
    const { data: studentSessions } = await supabase
      .from("student_sessions")
      .select("id, user_id, focus_seconds, joined_at, last_heartbeat")
      .eq("session_id", session.id);

    if (!studentSessions || studentSessions.length === 0) {
      setRoster([]);
      return;
    }

    const userIds = studentSessions.map((ss) => ss.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p.display_name || "Anonymous"])
    );

    setRoster(
      studentSessions.map((ss) => ({
        ...ss,
        display_name: profileMap.get(ss.user_id) || "Anonymous",
      }))
    );
  };

  // Fetch demo seats for alert computation
  const fetchDemoSeats = async () => {
    const { data } = await supabase
      .from("demo_seats")
      .select("id, seat_label, student_name, last_ping, focus_seconds")
      .eq("session_id", session.id) as { data: DemoSeatRow[] | null };
    if (data) setDemoSeats(data);
  };

  useEffect(() => {
    fetchRoster();
    fetchDemoSeats();

    const rosterChannel = supabase
      .channel(`roster-${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_sessions", filter: `session_id=eq.${session.id}` }, () => fetchRoster())
      .subscribe();

    const seatChannel = supabase
      .channel(`seat-alerts-${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "demo_seats", filter: `session_id=eq.${session.id}` }, () => fetchDemoSeats())
      .subscribe();

    return () => {
      supabase.removeChannel(rosterChannel);
      supabase.removeChannel(seatChannel);
    };
  }, [session.id]);

  const handleEndSession = async () => {
    setEnding(true);
    const { error } = await supabase
      .from("sessions")
      .update({ status: "ended", end_time: new Date().toISOString() })
      .eq("id", session.id);

    setEnding(false);
    if (error) {
      toast.error("Failed to end session");
      return;
    }
    toast.success("Session ended");
    onSessionEnded();
  };

  // --- Compute alerts from demo seats ---
  const alerts = demoSeats
    .map((s) => {
      const status = getSeatStatus(s.last_ping);
      const secondsAgo = s.last_ping ? Math.round((Date.now() - new Date(s.last_ping).getTime()) / 1000) : 999;
      return { seat_label: s.seat_label, student_name: s.student_name, status, secondsAgo };
    })
    .filter((a) => a.status !== "active")
    .sort((a, b) => {
      if (a.status === "disconnected" && b.status !== "disconnected") return -1;
      if (b.status === "disconnected" && a.status !== "disconnected") return 1;
      return b.secondsAgo - a.secondsAgo;
    });

  const disconnectedAlerts = alerts.filter((a) => a.status === "disconnected");
  const pausedAlerts = alerts.filter((a) => a.status === "paused");

  // Stats
  const demoActiveCount = demoSeats.filter((s) => getSeatStatus(s.last_ping) === "active").length;

  const stats = [
    { icon: Users, label: "Joined", value: `${demoSeats.length}` },
    { icon: UserCheck, label: "Active", value: `${demoActiveCount}` },
    { icon: AlertTriangle, label: "Warnings", value: `${alerts.length}`, highlight: alerts.length > 0 },
    { icon: WifiOff, label: "Disconnected", value: `${disconnectedAlerts.length}`, highlight: disconnectedAlerts.length > 0 },
  ];

  const handleRemoveSeat = async (seatLabel: string) => {
    const { error } = await supabase
      .from("demo_seats")
      .delete()
      .eq("session_id", session.id)
      .eq("seat_label", seatLabel);
    if (error) {
      toast.error(`Failed to remove ${seatLabel}`);
    } else {
      toast.success(`${seatLabel} removed`);
      fetchDemoSeats();
    }
  };

  const demoUrl = `${window.location.origin}/demo?session_id=${session.id}`;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold leading-tight">{course.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {course.section && <span className="text-xs text-muted-foreground">{course.section}</span>}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-focus-active opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-focus-active" />
              </span>
              <span className="text-xs font-medium text-focus-active">Live</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowNFC(!showNFC)}>
            <Smartphone className="w-3.5 h-3.5" />
            Share Link
          </Button>
          <Button size="sm" variant="destructive" className="gap-1.5 text-xs h-8" onClick={handleEndSession} disabled={ending}>
            <Pause className="w-3.5 h-3.5" />
            {ending ? "Ending…" : "End"}
          </Button>
        </div>
      </motion.div>

      {/* ── NFC Link (collapsible) ── */}
      <AnimatePresence>
        {showNFC && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-lg border border-border bg-muted/20 p-3 flex items-center gap-2">
              <div className="flex-1 bg-background rounded px-3 py-2 font-mono text-xs break-all select-all border border-border/50">
                {demoUrl}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0 text-xs h-8"
                onClick={() => {
                  navigator.clipboard.writeText(demoUrl);
                  toast.success("Copied!");
                }}
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </Button>
              <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </Button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-lg border p-3 ${stat.highlight ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <stat.icon className={`w-3.5 h-3.5 ${stat.highlight ? "text-destructive" : "text-muted-foreground"}`} />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className={`font-display text-xl font-bold ${stat.highlight ? "text-destructive" : "text-foreground"}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Alerts (single compact section) ── */}
      {disconnectedAlerts.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-destructive" />
            <span className="text-xs font-bold text-destructive uppercase tracking-wide">
              {disconnectedAlerts.length} Disconnected
            </span>
          </div>
          <div className="space-y-1">
            {disconnectedAlerts.map((a) => (
              <div key={a.seat_label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-destructive">{a.seat_label}</span>
                  {a.student_name && <span className="text-destructive/80">{a.student_name}</span>}
                  <span className="text-muted-foreground">· {a.secondsAgo}s ago</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10 h-6 px-2"
                  onClick={() => handleRemoveSeat(a.seat_label)}
                >
                  <UserX className="w-3 h-3" /> Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pausedAlerts.length > 0 && (
        <div className="rounded-lg border border-focus-paused/40 bg-focus-paused/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-focus-paused" />
            <span className="text-xs font-bold text-focus-paused uppercase tracking-wide">
              {pausedAlerts.length} Paused
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {pausedAlerts.map((a) => (
              <span key={a.seat_label} className="text-xs text-muted-foreground">
                <span className="font-mono font-bold text-focus-paused">{a.seat_label}</span>
                {a.student_name && ` ${a.student_name}`} · {a.secondsAgo}s
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Seat Grid / Roster */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
          {/* Toggle header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20 gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-background rounded-lg p-0.5 border border-border/50">
              <Button
                variant={viewMode === "seats" ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 text-xs h-7 px-3"
                onClick={() => setViewMode("seats")}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid
              </Button>
              <Button
                variant={viewMode === "roster" ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 text-xs h-7 px-3"
                onClick={() => setViewMode("roster")}
              >
                <List className="w-3.5 h-3.5" /> Roster
              </Button>
            </div>

            {viewMode === "seats" && (
              <div className="flex items-center gap-3">
                {[
                  { label: "Rows", value: gridRows, set: setGridRows, max: 20 },
                  { label: "Cols", value: gridCols, set: setGridCols, max: 20 },
                ].map(({ label, value, set, max }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                    <button onClick={() => set((v) => Math.max(1, v - 1))} className="w-5 h-5 rounded border border-border text-xs font-bold hover:bg-muted transition-colors">−</button>
                    <span className="w-5 text-center font-mono text-xs font-semibold">{value}</span>
                    <button onClick={() => set((v) => Math.min(max, v + 1))} className="w-5 h-5 rounded border border-border text-xs font-bold hover:bg-muted transition-colors">+</button>
                  </div>
                ))}
              </div>
            )}

            {viewMode === "roster" && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => exportRosterCSV(roster, session.start_time, session.late_join_cutoff, course.name)}
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </Button>
            )}
          </div>

          {/* Grid view */}
          {viewMode === "seats" && (
            <div className="p-3">
              <DemoSeatGrid sessionId={session.id} rows={gridRows} cols={gridCols} />
            </div>
          )}

          {/* Roster view */}
          {viewMode === "roster" && (
            roster.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No authenticated students have joined yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Student</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Attendance</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Focus</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((student) => {
                      const activity = getActivityStatus(student.last_heartbeat);
                      const attendance = getAttendanceStatus(student.joined_at, session.start_time, session.late_join_cutoff);
                      return (
                        <tr key={student.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 text-sm font-medium">{student.display_name}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <StatusDot status={activity} />
                              <span className="text-xs text-muted-foreground capitalize">{activity}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5"><AttendanceBadge status={attendance} /></td>
                          <td className="px-4 py-2.5 font-mono text-xs">{formatTime(student.focus_seconds)}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">
                            {new Date(student.joined_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Right: Joined Students sidebar */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Students</span>
            </div>
            <span className="text-xs font-mono font-semibold text-muted-foreground">{demoSeats.length}</span>
          </div>

          {demoSeats.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Share the link to get students connected.
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="divide-y divide-border/50">
                {demoSeats
                  .sort((a, b) => {
                    const sa = getSeatStatus(a.last_ping);
                    const sb = getSeatStatus(b.last_ping);
                    const order = { active: 0, paused: 1, disconnected: 2 };
                    return order[sa] - order[sb];
                  })
                  .map((seat) => {
                    const status = getSeatStatus(seat.last_ping);
                    const dotColor = status === "active" ? "bg-focus-active" : status === "paused" ? "bg-focus-paused" : "bg-destructive";
                    return (
                      <div key={seat.id} className="group flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor} ${status === "active" ? "animate-pulse" : ""}`} />
                          <span className="font-mono text-[11px] font-bold text-muted-foreground shrink-0">{seat.seat_label}</span>
                          <span className="text-sm font-medium truncate">{seat.student_name || "Anon"}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {formatTime(seat.focus_seconds || 0)}
                          </span>
                          <button
                            onClick={() => handleRemoveSeat(seat.seat_label)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 p-0.5"
                            title="Remove"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveSessionView;
