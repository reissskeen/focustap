import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  Users, BarChart3, Download, Pause, UserCheck, LayoutGrid, List, ExternalLink, Smartphone, Copy,
  AlertTriangle, WifiOff, UserX, MapPin,
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

// --- Types ---

interface RosterStudent {
  id: string;
  user_id: string;
  display_name: string;
  focus_seconds: number;
  joined_at: string;
  last_heartbeat: string | null;
  seat_label: string | null;
}

type StudentSessionRealtimeRow = Omit<RosterStudent, "display_name">;

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
  const [ending, setEnding] = useState(false);
  const [tick, setTick] = useState(0);

  // Batch buffer: accumulate realtime heartbeat updates and flush every 2s
  // This prevents one re-render per student per 3s (jank at scale)
  const pendingUpdatesRef = useRef<Map<string, StudentSessionRealtimeRow>>(new Map());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPendingUpdates = useCallback(() => {
    flushTimerRef.current = null;
    if (pendingUpdatesRef.current.size === 0) return;
    const batch = new Map(pendingUpdatesRef.current);
    pendingUpdatesRef.current.clear();
    setRoster((prev) =>
      prev.map((student) => {
        const u = batch.get(student.id);
        if (!u) return student;
        return {
          ...student,
          focus_seconds: u.focus_seconds,
          last_heartbeat: u.last_heartbeat,
          seat_label: u.seat_label ?? student.seat_label,
        };
      })
    );
  }, []);

  // 1-second tick so getActivityStatus() re-evaluates with fresh Date.now()
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch roster (authenticated students)
  const fetchRoster = async () => {
    const { data: studentSessions } = await supabase
      .from("student_sessions")
      .select("id, user_id, focus_seconds, joined_at, last_heartbeat, seat_label")
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
        seat_label: ss.seat_label ?? null,
        display_name: profileMap.get(ss.user_id) || "Anonymous",
      }))
    );
  };

  useEffect(() => {
    fetchRoster();

    const rosterChannel = supabase
      .channel(`roster-${session.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_sessions", filter: `session_id=eq.${session.id}` },
        (payload: RealtimePostgresChangesPayload<StudentSessionRealtimeRow>) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as StudentSessionRealtimeRow;
            // Buffer the update — flush at most once every 2s to avoid
            // per-heartbeat re-renders (3s interval × N students = jank)
            pendingUpdatesRef.current.set(updated.id, updated);
            if (!flushTimerRef.current) {
              flushTimerRef.current = setTimeout(flushPendingUpdates, 2000);
            }
            return;
          }
          fetchRoster();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rosterChannel);
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, [session.id, flushPendingUpdates]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // --- Compute alerts from authenticated roster ---
  const alerts = roster
    .map((s) => {
      const status = getActivityStatus(s.last_heartbeat);
      const secondsAgo = s.last_heartbeat
        ? Math.round((Date.now() - new Date(s.last_heartbeat).getTime()) / 1000)
        : 999;
      return { display_name: s.display_name, seat_label: s.seat_label, status, secondsAgo };
    })
    .filter((a) => a.status !== "active")
    .sort((a, b) => {
      if (a.status === "disconnected" && b.status !== "disconnected") return -1;
      if (b.status === "disconnected" && a.status !== "disconnected") return 1;
      return b.secondsAgo - a.secondsAgo;
    });

  const disconnectedAlerts = alerts.filter((a) => a.status === "disconnected");
  const pausedAlerts = alerts.filter((a) => a.status === "paused");
  const activeCount = roster.filter((s) => getActivityStatus(s.last_heartbeat) === "active").length;

  const stats = [
    { icon: Users, label: "Joined", value: `${roster.length}` },
    { icon: UserCheck, label: "Active", value: `${activeCount}` },
    { icon: AlertTriangle, label: "Warnings", value: `${alerts.length}`, highlight: alerts.length > 0 },
    { icon: WifiOff, label: "Disconnected", value: `${disconnectedAlerts.length}`, highlight: disconnectedAlerts.length > 0 },
  ];

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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
            <BarChart3 className="w-5 h-5" style={{ color: "#22d3ee" }} />
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
              <div key={a.display_name} className="flex items-center gap-2 text-xs">
                {a.seat_label && <span className="font-mono font-bold text-destructive">{a.seat_label}</span>}
                <span className="text-destructive/80">{a.display_name}</span>
                <span className="text-muted-foreground">· {a.secondsAgo}s ago</span>
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
              <span key={a.display_name} className="text-xs text-muted-foreground">
                {a.seat_label && <span className="font-mono font-bold text-focus-paused">{a.seat_label} </span>}
                {a.display_name} · {a.secondsAgo}s
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

          {/* Grid view — tiles from authenticated roster */}
          {viewMode === "seats" && (
            <div className="p-4">
              {roster.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No students have joined yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {[...roster]
                    .sort((a, b) => {
                      const sa = getActivityStatus(a.last_heartbeat);
                      const sb = getActivityStatus(b.last_heartbeat);
                      const order = { active: 0, paused: 1, disconnected: 2 };
                      return order[sa] - order[sb];
                    })
                    .map((student) => {
                      const activity = getActivityStatus(student.last_heartbeat);
                      const dotColor =
                        activity === "active" ? "bg-focus-active" :
                        activity === "paused" ? "bg-focus-paused" : "bg-destructive";
                      const borderColor =
                        activity === "active" ? "border-focus-active/30" :
                        activity === "paused" ? "border-focus-paused/30" : "border-destructive/30";
                      return (
                        <div
                          key={student.id}
                          className={`rounded-lg border ${borderColor} bg-card p-3 flex flex-col gap-1`}
                        >
                          {student.seat_label && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                              <MapPin className="w-3 h-3" />
                              {student.seat_label}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor} ${activity === "active" ? "animate-pulse" : ""}`} />
                            <span className="text-sm font-medium truncate">{student.display_name}</span>
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {formatTime(student.focus_seconds)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
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
            <span className="text-xs font-mono font-semibold text-muted-foreground">{roster.length}</span>
          </div>

          {roster.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No students have joined yet.
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="divide-y divide-border/50">
                {[...roster]
                  .sort((a, b) => {
                    const sa = getActivityStatus(a.last_heartbeat);
                    const sb = getActivityStatus(b.last_heartbeat);
                    const order = { active: 0, paused: 1, disconnected: 2 };
                    return order[sa] - order[sb];
                  })
                  .map((student) => {
                    const status = getActivityStatus(student.last_heartbeat);
                    const dotColor = status === "active" ? "bg-focus-active" : status === "paused" ? "bg-focus-paused" : "bg-destructive";
                    return (
                      <div key={student.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor} ${status === "active" ? "animate-pulse" : ""}`} />
                          <div className="min-w-0">
                            <span className="text-sm font-medium truncate block">{student.display_name}</span>
                            {student.seat_label && (
                              <span className="font-mono text-[10px] text-muted-foreground">{student.seat_label}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                          {formatTime(student.focus_seconds || 0)}
                        </span>
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
