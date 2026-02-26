import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Clock, BarChart3, Download, Eye, Pause, UserCheck, LayoutGrid, List, ExternalLink, Smartphone, Copy,
  AlertTriangle, ShieldAlert, WifiOff, UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  return <div className={`w-2.5 h-2.5 rounded-full ${color}`} />;
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
      .select("id, seat_label, student_name, last_ping")
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
      // disconnected first, then paused; within same status, longest ago first
      if (a.status === "disconnected" && b.status !== "disconnected") return -1;
      if (b.status === "disconnected" && a.status !== "disconnected") return 1;
      return b.secondsAgo - a.secondsAgo;
    });

  const disconnectedAlerts = alerts.filter((a) => a.status === "disconnected");
  const pausedAlerts = alerts.filter((a) => a.status === "paused");

  // Stats
  const activeCount = roster.filter((s) => getActivityStatus(s.last_heartbeat) === "active").length;
  const avgFocus = roster.length
    ? Math.round(roster.reduce((sum, s) => sum + s.focus_seconds, 0) / roster.length)
    : 0;

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
      toast.success(`${seatLabel} removed from session`);
      fetchDemoSeats();
    }
  };

  const demoUrl = `${window.location.origin}/demo?session_id=${session.id}`;

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">{course.name}</h1>
            <p className="text-sm text-muted-foreground">
              {course.section ? `${course.section} · ` : ""}
              Live Session
            </p>
          </div>
          {/* Live heartbeat indicator */}
          <span className="relative flex h-3 w-3 ml-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-focus-active opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-focus-active"></span>
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowNFC(!showNFC)}>
            <Smartphone className="w-3.5 h-3.5" />
            NFC Link
          </Button>
          <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={handleEndSession} disabled={ending}>
            <Pause className="w-3.5 h-3.5" />
            {ending ? "Ending…" : "End Session"}
          </Button>
        </div>
      </motion.div>

      {/* NFC Link (collapsible) */}
      <AnimatePresence>
        {showNFC && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted/40 rounded-lg px-3 py-2 font-mono text-xs break-all select-all border border-border">
                  {demoUrl}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(demoUrl);
                    toast.success("Copied!");
                  }}
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </Button>
                <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== DISCONNECTED WARNINGS — FIRST THING ===== */}
      {disconnectedAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="rounded-xl border-2 border-destructive/60 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-destructive" />
              <h2 className="font-display font-bold text-sm text-destructive">
                ⚠ {disconnectedAlerts.length} student{disconnectedAlerts.length !== 1 ? "s" : ""} disconnected
              </h2>
            </div>
            <div className="space-y-2">
              {disconnectedAlerts.map((a) => (
                <div key={a.seat_label} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-3.5 h-3.5 text-destructive" />
                    <span className="font-mono font-bold text-destructive">{a.seat_label}</span>
                    {a.student_name && <span className="font-medium text-destructive">{a.student_name}</span>}
                    <span className="text-destructive/80">
                      — No signal for <span className="font-bold">{a.secondsAgo}s</span>
                      {a.secondsAgo > 30 && " (likely left the page)"}
                      {a.secondsAgo > 4 && a.secondsAgo <= 30 && " (switched tabs or locked phone)"}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1 text-xs h-7 px-2 shrink-0"
                    onClick={() => handleRemoveSeat(a.seat_label)}
                  >
                    <UserX className="w-3.5 h-3.5" /> Remove
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Detects: tab switch · browser minimize · phone lock · page close · app switch · swipe away
            </p>
          </div>
        </motion.div>
      )}

      {/* ===== PAUSED WARNINGS ===== */}
      {pausedAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="rounded-xl border-2 border-focus-paused/60 bg-focus-paused/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-focus-paused" />
              <h2 className="font-display font-bold text-sm text-focus-paused">
                {pausedAlerts.length} student{pausedAlerts.length !== 1 ? "s" : ""} may have left the screen
              </h2>
            </div>
            <div className="space-y-1">
              {pausedAlerts.map((a) => (
                <div key={a.seat_label} className="flex items-center gap-2 text-sm">
                   <AlertTriangle className="w-3.5 h-3.5 text-focus-paused" />
                   <span className="font-mono font-bold text-focus-paused">{a.seat_label}</span>
                   {a.student_name && <span className="font-medium text-focus-paused">{a.student_name}</span>}
                   <span className="text-muted-foreground">
                     — Inactive for <span className="font-bold">{a.secondsAgo}s</span>
                    {" "}(switched tabs, minimized, or phone locked)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card rounded-xl p-4 ${stat.highlight ? "ring-1 ring-destructive/40" : ""}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.highlight ? "text-destructive" : "text-muted-foreground"}`} />
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            </div>
            <p className={`font-display text-2xl font-bold ${stat.highlight ? "text-destructive" : ""}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ===== JOINED STUDENTS LIST ===== */}
      {demoSeats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-xl overflow-hidden mb-6"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-bold">Joined Students</h3>
              <span className="text-xs text-muted-foreground">({demoSeats.length})</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {demoSeats.map((seat) => {
              const status = getSeatStatus(seat.last_ping);
              const dotColor = status === "active" ? "bg-focus-active" : status === "paused" ? "bg-focus-paused" : "bg-destructive";
              const statusLabel = status === "active" ? "Active" : status === "paused" ? "Paused" : "Disconnected";
              return (
                <div key={seat.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${dotColor} ${status === "active" ? "animate-pulse" : ""}`} />
                    <span className="font-mono text-sm font-bold text-muted-foreground">{seat.seat_label}</span>
                    <span className="text-sm font-medium">{seat.student_name || "Anonymous"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      status === "active" ? "bg-focus-active/15 text-focus-active" :
                      status === "paused" ? "bg-focus-paused/15 text-focus-paused" :
                      "bg-destructive/15 text-destructive"
                    }`}>{statusLabel}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                    onClick={() => handleRemoveSeat(seat.seat_label)}
                  >
                    <UserX className="w-3.5 h-3.5" /> Remove
                  </Button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}


      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        {/* Toggle header */}
        <div className="flex items-center justify-between p-4 border-b gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
            <Button
              variant={viewMode === "seats" ? "default" : "ghost"}
              size="sm"
              className="gap-1.5 text-xs h-7 px-3"
              onClick={() => setViewMode("seats")}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Seat Grid
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
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-medium text-muted-foreground">Rows</label>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => setGridRows((r) => Math.max(1, r - 1))} className="w-5 h-5 rounded border border-border text-xs font-bold hover:bg-muted transition-colors">−</button>
                  <span className="w-6 text-center font-mono text-xs font-semibold">{gridRows}</span>
                  <button onClick={() => setGridRows((r) => Math.min(20, r + 1))} className="w-5 h-5 rounded border border-border text-xs font-bold hover:bg-muted transition-colors">+</button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-medium text-muted-foreground">Cols</label>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => setGridCols((c) => Math.max(1, c - 1))} className="w-5 h-5 rounded border border-border text-xs font-bold hover:bg-muted transition-colors">−</button>
                  <span className="w-6 text-center font-mono text-xs font-semibold">{gridCols}</span>
                  <button onClick={() => setGridCols((c) => Math.min(20, c + 1))} className="w-5 h-5 rounded border border-border text-xs font-bold hover:bg-muted transition-colors">+</button>
                </div>
              </div>
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

        {/* Seat Grid view (default) */}
        {viewMode === "seats" && (
          <div className="p-4">
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
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Focus Time</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Joined</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((student) => {
                    const activity = getActivityStatus(student.last_heartbeat);
                    const attendance = getAttendanceStatus(student.joined_at, session.start_time, session.late_join_cutoff);
                    const activityLabel = activity === "active" ? "Active" : activity === "paused" ? "Paused" : "Disconnected";
                    return (
                      <tr key={student.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-sm">{student.display_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StatusDot status={activity} />
                            <span className="text-sm text-muted-foreground">{activityLabel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <AttendanceBadge status={attendance} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm">{formatTime(student.focus_seconds)}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(student.joined_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            <Eye className="w-3.5 h-3.5" /> View Notes
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </motion.div>
    </>
  );
};

export default ActiveSessionView;
