import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, Clock, BarChart3, QrCode, Download, Eye, Pause, UserCheck, LayoutGrid, List,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
import DemoSeatGrid from "./DemoSeatGrid";

interface RosterStudent {
  id: string;
  user_id: string;
  display_name: string;
  focus_seconds: number;
  joined_at: string;
  last_heartbeat: string | null;
}

interface ActiveSessionViewProps {
  session: Tables<"sessions">;
  course: Tables<"courses">;
  onSessionEnded: () => void;
}

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

const ActiveSessionView = ({ session, course, onSessionEnded }: ActiveSessionViewProps) => {
  const [showQR, setShowQR] = useState(true);
  const [viewMode, setViewMode] = useState<"roster" | "seats">("roster");
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [ending, setEnding] = useState(false);

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

  useEffect(() => {
    fetchRoster();

    const channel = supabase
      .channel(`roster-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_sessions",
          filter: `session_id=eq.${session.id}`,
        },
        () => fetchRoster()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

  const activeCount = roster.filter((s) => getActivityStatus(s.last_heartbeat) === "active").length;
  const pausedCount = roster.filter((s) => getActivityStatus(s.last_heartbeat) === "paused").length;

  const avgFocus = roster.length
    ? Math.round(roster.reduce((sum, s) => sum + s.focus_seconds, 0) / roster.length)
    : 0;

  const stats = [
    { icon: Users, label: "Students", value: `${roster.length}` },
    { icon: UserCheck, label: "Active", value: `${activeCount}` },
    { icon: Clock, label: "Avg Focus", value: formatTime(avgFocus) },
    {
      icon: BarChart3,
      label: "Participation",
      value: roster.length ? `${Math.round((activeCount / roster.length) * 100)}%` : "—",
    },
  ];

  const launchUrl = `${window.location.origin}/launch?session_id=${session.id}`;
  const demoUrl = `${window.location.origin}/demo?session_id=${session.id}`;

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="font-display text-2xl font-bold">{course.name}</h1>
          <p className="text-sm text-muted-foreground">
            {course.section ? `${course.section} · ` : ""}
            {new Date(session.start_time).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowQR(!showQR)}>
            <QrCode className="w-4 h-4" />
            {showQR ? "Hide QR" : "Show QR"}
          </Button>
          <Button size="sm" variant="destructive" className="gap-2" onClick={handleEndSession} disabled={ending}>
            <Pause className="w-4 h-4" />
            {ending ? "Ending…" : "End Session"}
          </Button>
        </div>
      </motion.div>

      {/* QR Code(s) */}
      {showQR && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-8">
          <div className="glass-card rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Student join QR */}
            <div className="flex flex-col items-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Student Join</p>
              <QRCodeSVG value={launchUrl} size={160} bgColor="transparent" fgColor="hsl(200 25% 10%)" level="M" />
              <p className="mt-3 text-xs text-muted-foreground font-mono break-all max-w-[220px] text-center">{launchUrl}</p>
            </div>
            {/* Demo QR */}
            <div className="flex flex-col items-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">🎤 Demo / NFC</p>
              <QRCodeSVG value={demoUrl} size={160} bgColor="transparent" fgColor="hsl(200 25% 10%)" level="M" />
              <p className="mt-3 text-xs text-muted-foreground font-mono break-all max-w-[220px] text-center">{demoUrl}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            </div>
            <p className="font-display text-2xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* View toggle + content */}
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
              variant={viewMode === "roster" ? "default" : "ghost"}
              size="sm"
              className="gap-1.5 text-xs h-7 px-3"
              onClick={() => setViewMode("roster")}
            >
              <List className="w-3.5 h-3.5" /> Roster
            </Button>
            <Button
              variant={viewMode === "seats" ? "default" : "ghost"}
              size="sm"
              className="gap-1.5 text-xs h-7 px-3"
              onClick={() => setViewMode("seats")}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Seat Grid
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

        {/* Roster view */}
        {viewMode === "roster" && (
          roster.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No students have joined yet. Share the QR code to get started.
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

        {/* Seat Grid view */}
        {viewMode === "seats" && (
          <div className="p-4">
            <DemoSeatGrid sessionId={session.id} totalSeats={30} />
          </div>
        )}
      </motion.div>
    </>
  );
};

export default ActiveSessionView;
