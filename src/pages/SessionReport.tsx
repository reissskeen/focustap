import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  ArrowLeft, Printer, Clock, Users, TrendingUp, Award,
  CheckCircle2, AlertTriangle, XCircle,
} from "lucide-react";
import {
  computeStudentReport, getScoreColor, getScoreLabel,
  type StudentReport,
} from "@/lib/engagementScore";

interface SessionData {
  id: string;
  course_name: string;
  section: string | null;
  start_time: string;
  end_time: string;
}

const formatDuration = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

const ScoreRing = ({ score, size = 64 }: { score: number; size?: number }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = getScoreColor(score);

  return (
    <svg width={size} height={size} className="block">
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="hsl(var(--muted))" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700"
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
        className="fill-foreground font-bold" style={{ fontSize: size * 0.28 }}>
        {score}
      </text>
    </svg>
  );
};

const AttendanceIcon = ({ status }: { status: string }) => {
  if (status === "present") return <CheckCircle2 className="h-4 w-4 text-[hsl(152,69%,45%)]" />;
  if (status === "late") return <AlertTriangle className="h-4 w-4 text-[hsl(38,92%,50%)]" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

const ATTENDANCE_COLORS = [
  "hsl(152, 69%, 45%)", // present
  "hsl(38, 92%, 50%)",  // late
  "hsl(0, 72%, 51%)",   // absent
];

export default function SessionReport() {
  const { sessionId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionData | null>(null);
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user || !sessionId) return;
    loadReport();
  }, [authLoading, user, sessionId]);

  const loadReport = async () => {
    // Fetch session + course
    const { data: sessionData } = await supabase
      .from("sessions")
      .select("id, course_id, start_time, end_time, status")
      .eq("id", sessionId!)
      .single();

    if (!sessionData || !sessionData.end_time) {
      setLoading(false);
      return;
    }

    const { data: courseData } = await supabase
      .from("courses")
      .select("name, section")
      .eq("id", sessionData.course_id)
      .single();

    setSession({
      id: sessionData.id,
      course_name: courseData?.name || "Unknown",
      section: courseData?.section || null,
      start_time: sessionData.start_time,
      end_time: sessionData.end_time,
    });

    // Fetch demo seats for this session
    const { data: seats } = await supabase
      .from("demo_seats")
      .select("seat_label, student_name, joined_at, last_ping, focus_seconds")
      .eq("session_id", sessionId!);

    // Fetch authenticated student_sessions too
    const { data: studentSessions } = await supabase
      .from("student_sessions")
      .select("user_id, joined_at, last_heartbeat, focus_seconds, note_save_count")
      .eq("session_id", sessionId!);

    // Fetch pause counts from focus_events for distraction resistance scoring
    const { data: pauseEvents } = await supabase
      .from("focus_events")
      .select("user_id")
      .eq("session_id", sessionId!)
      .eq("event_type", "pause");

    const pauseCountMap: Record<string, number> = {};
    (pauseEvents || []).forEach((e) => {
      pauseCountMap[e.user_id] = (pauseCountMap[e.user_id] ?? 0) + 1;
    });

    // Get profiles for student_sessions
    const userIds = (studentSessions || []).map((s) => s.user_id);
    let profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      profileMap = Object.fromEntries(
        (profiles || []).map((p) => [p.user_id, p.display_name || "Student"])
      );
    }

    const allReports: StudentReport[] = [];

    // Demo seats
    (seats || []).forEach((s) => {
      allReports.push(
        computeStudentReport({
          name: s.student_name || s.seat_label,
          seatLabel: s.seat_label,
          focusSeconds: s.focus_seconds,
          joinedAt: s.joined_at,
          lastPing: s.last_ping,
          sessionStartTime: sessionData.start_time,
          sessionEndTime: sessionData.end_time!,
        })
      );
    });

    // Authenticated students
    (studentSessions || []).forEach((ss) => {
      allReports.push(
        computeStudentReport({
          name: profileMap[ss.user_id] || "Student",
          seatLabel: "-",
          focusSeconds: ss.focus_seconds,
          joinedAt: ss.joined_at,
          lastPing: ss.last_heartbeat,
          sessionStartTime: sessionData.start_time,
          sessionEndTime: sessionData.end_time!,
          pauseCount: pauseCountMap[ss.user_id] ?? 0,
          noteSaveCount: ss.note_save_count ?? 0,
        })
      );
    });

    // Sort by engagement score desc
    allReports.sort((a, b) => b.engagementScore - a.engagementScore);
    setReports(allReports);
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || reports.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">No Report Data</h1>
          <p className="text-muted-foreground mb-6">
            This session has no student data to report on.
          </p>
          <Button variant="outline" onClick={() => navigate("/teacher")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Aggregates
  const avgScore = Math.round(reports.reduce((a, r) => a + r.engagementScore, 0) / reports.length);
  const totalFocus = reports.reduce((a, r) => a + r.focusSeconds, 0);
  const avgFocus = Math.round(totalFocus / reports.length);
  const presentCount = reports.filter((r) => r.attendanceStatus === "present").length;
  const lateCount = reports.filter((r) => r.attendanceStatus === "late").length;
  const absentCount = 0; // no absent since they have data

  const attendancePieData = [
    { name: "On Time", value: presentCount },
    { name: "Late", value: lateCount },
    ...(absentCount > 0 ? [{ name: "Absent", value: absentCount }] : []),
  ].filter((d) => d.value > 0);

  const focusBarData = reports.map((r) => ({
    name: r.name,
    focus: r.focusSeconds,
    score: r.engagementScore,
  }));

  const sessionDuration = reports[0]?.sessionDurationSeconds || 0;
  const sessionDate = new Date(session.start_time).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const sessionTime = new Date(session.start_time).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hide navbar when printing */}
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 print:px-0 print:py-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Button variant="ghost" size="sm" onClick={() => navigate("/teacher")} className="print:hidden">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-foreground font-[Space_Grotesk]">
                Session Report
              </h1>
            </div>
            <p className="text-muted-foreground text-sm ml-11 print:ml-0">
              {session.course_name}{session.section ? ` — ${session.section}` : ""} · {sessionDate} at {sessionTime}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
            <Printer className="h-4 w-4 mr-2" /> Print Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Engagement</p>
                <p className="text-xl font-bold text-foreground">{avgScore}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Students</p>
                <p className="text-xl font-bold text-foreground">{reports.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Focus Time</p>
                <p className="text-xl font-bold text-foreground">{formatDuration(avgFocus)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Session Length</p>
                <p className="text-xl font-bold text-foreground">{formatDuration(sessionDuration)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Focus Distribution */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Focus Time by Student</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={focusBarData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => `${v}s`} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`${formatDuration(value)}`, "Focus"]}
                    />
                    <Bar dataKey="focus" radius={[6, 6, 0, 0]}>
                      {focusBarData.map((entry, i) => (
                        <Cell key={i} fill={getScoreColor(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      cx="50%" cy="50%"
                      innerRadius={40} outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {attendancePieData.map((_, i) => (
                        <Cell key={i} fill={ATTENDANCE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Roster Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Student Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Seat</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Focus Time</TableHead>
                  <TableHead>Focus %</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground font-mono text-sm">{i + 1}</TableCell>
                    <TableCell className="font-medium text-foreground">{r.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">{r.seatLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <AttendanceIcon status={r.attendanceStatus} />
                        <span className="text-sm capitalize">{r.attendanceStatus}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatDuration(r.focusSeconds)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={r.focusRatio * 100} className="h-2 w-16" />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(r.focusRatio * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <ScoreRing score={r.engagementScore} size={44} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: getScoreColor(r.engagementScore), color: getScoreColor(r.engagementScore) }}
                      >
                        {getScoreLabel(r.engagementScore)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Class average score ring */}
        <div className="mt-6 flex items-center justify-center gap-6 print:mt-4">
          <div className="text-center">
            <ScoreRing score={avgScore} size={96} />
            <p className="text-sm font-medium text-foreground mt-2">Class Average</p>
            <p className="text-xs text-muted-foreground">{getScoreLabel(avgScore)}</p>
          </div>
        </div>

        {/* Print footer */}
        <div className="hidden print:block mt-8 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Generated by FocusTap · {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
