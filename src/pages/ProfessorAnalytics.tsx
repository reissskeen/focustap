import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import {
  ArrowLeft, BarChart3, Users, TrendingUp, BookOpen, ChevronRight, GraduationCap,
} from "lucide-react";
import { computeStudentReport, getScoreColor, getScoreLabel } from "@/lib/engagementScore";

// ------- Types -------

interface CourseRow {
  id: string;
  name: string;
  section: string | null;
  teacher_user_id: string;
  teacher_name?: string;
}

interface SessionSummary {
  id: string;
  start_time: string;
  end_time: string | null;
  student_count: number;
  avg_score: number;
}

interface StudentSessionRow {
  user_id: string;
  session_id: string;
  joined_at: string;
  last_heartbeat: string | null;
  focus_seconds: number;
  note_save_count: number;
}

interface StudentStat {
  userId: string;
  name: string;
  sessionsAttended: number;
  avgScore: number;
  scores: number[]; // chronological
  lastScore: number;
}

type UserProfile = {
  institution_id: string | null;
  institution_role: string | null;
};

// ------- Helpers -------

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const ScoreBadge = ({ score }: { score: number }) => (
  <span
    className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold text-white"
    style={{ backgroundColor: getScoreColor(score) }}
  >
    {score}
  </span>
);

const TrendArrow = ({ scores }: { scores: number[] }) => {
  if (scores.length < 2) return <span className="text-muted-foreground text-xs">—</span>;
  const delta = scores[scores.length - 1] - scores[scores.length - 2];
  if (delta > 3) return <span className="text-[hsl(152,69%,45%)] text-sm font-bold">↑</span>;
  if (delta < -3) return <span className="text-destructive text-sm font-bold">↓</span>;
  return <span className="text-muted-foreground text-sm">→</span>;
};

// ------- Main Component -------

type View = "overview" | "course";

export default function ProfessorAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [sessionsByCourse, setSessionsByCourse] = useState<Record<string, SessionSummary[]>>({});
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Course drill-down
  const [view, setView] = useState<View>("overview");
  const [selectedCourse, setSelectedCourse] = useState<CourseRow | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  const [sessionTrend, setSessionTrend] = useState<{ date: string; avg: number }[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ------- Load overview -------

  useEffect(() => {
    if (authLoading || !user) return;
    loadOverview();
  }, [authLoading, user]);

  const loadOverview = async () => {
    setLoadingOverview(true);

    // Get user profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("institution_id, institution_role")
      .eq("user_id", user!.id)
      .maybeSingle();

    const p: UserProfile = {
      institution_id: profileData?.institution_id ?? null,
      institution_role: profileData?.institution_role ?? null,
    };
    setProfile(p);

    let fetchedCourses: CourseRow[] = [];

    if (p.institution_role === "dept_admin" || p.institution_role === "institution_admin") {
      // Get all teachers in this institution
      const { data: teacherProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .eq("institution_id", p.institution_id!)
        .eq("institution_role", "teacher");

      const teacherIds = (teacherProfiles || []).map((t) => t.user_id);
      const teacherNameMap = Object.fromEntries(
        (teacherProfiles || []).map((t) => [t.user_id, t.display_name || "Professor"])
      );

      if (teacherIds.length > 0) {
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, name, section, teacher_user_id")
          .in("teacher_user_id", teacherIds)
          .order("name");

        fetchedCourses = (coursesData || []).map((c) => ({
          ...c,
          teacher_name: teacherNameMap[c.teacher_user_id] || "Professor",
        }));
      }
    } else {
      // Regular teacher: own courses only
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, name, section, teacher_user_id")
        .eq("teacher_user_id", user!.id)
        .order("name");

      fetchedCourses = coursesData || [];
    }

    setCourses(fetchedCourses);

    // Fetch ended sessions for each course (count only + last session info)
    if (fetchedCourses.length > 0) {
      const courseIds = fetchedCourses.map((c) => c.id);
      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("id, course_id, start_time, end_time")
        .in("course_id", courseIds)
        .eq("status", "ended")
        .order("start_time", { ascending: true });

      const byC: Record<string, SessionSummary[]> = {};
      (sessionsData || []).forEach((s) => {
        if (!byC[s.course_id]) byC[s.course_id] = [];
        byC[s.course_id].push({
          id: s.id,
          start_time: s.start_time,
          end_time: s.end_time,
          student_count: 0,
          avg_score: 0,
        });
      });
      setSessionsByCourse(byC);
    }

    setLoadingOverview(false);
  };

  // ------- Load course detail -------

  const openCourse = useCallback(async (course: CourseRow) => {
    setSelectedCourse(course);
    setView("course");
    setLoadingDetail(true);
    setStudentStats([]);
    setSessionTrend([]);

    const sessions = sessionsByCourse[course.id] || [];
    if (sessions.length === 0) {
      setLoadingDetail(false);
      return;
    }

    const sessionIds = sessions.map((s) => s.id);

    // Fetch student_sessions for all sessions in this course
    const { data: rawSS } = await supabase
      .from("student_sessions")
      .select("user_id, session_id, joined_at, last_heartbeat, focus_seconds, note_save_count")
      .in("session_id", sessionIds);

    const studentSessionRows = (rawSS ?? []) as unknown as StudentSessionRow[];

    // Fetch pause counts
    const { data: pauseEvents } = await supabase
      .from("focus_events")
      .select("user_id, session_id")
      .in("session_id", sessionIds)
      .eq("event_type", "pause");

    const pauseCountMap: Record<string, Record<string, number>> = {};
    (pauseEvents || []).forEach((e) => {
      if (!pauseCountMap[e.session_id]) pauseCountMap[e.session_id] = {};
      pauseCountMap[e.session_id][e.user_id] =
        (pauseCountMap[e.session_id][e.user_id] ?? 0) + 1;
    });

    // Fetch profiles
    const userIds = [...new Set(studentSessionRows.map((s) => s.user_id))];
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

    // Compute scores per session, per student
    const sessionScoreMap: Record<string, number[]> = {}; // sessionId → list of scores
    const studentSessionScores: Record<string, { sessionId: string; score: number; date: string }[]> = {};

    const sessionMeta = Object.fromEntries(sessions.map((s) => [s.id, s]));

    studentSessionRows.forEach((ss) => {
      const sessionInfo = sessionMeta[ss.session_id];
      if (!sessionInfo?.end_time) return;

      const report = computeStudentReport({
        name: profileMap[ss.user_id] || "Student",
        seatLabel: "",
        focusSeconds: ss.focus_seconds,
        joinedAt: ss.joined_at,
        lastPing: ss.last_heartbeat,
        sessionStartTime: sessionInfo.start_time,
        sessionEndTime: sessionInfo.end_time,
        pauseCount: pauseCountMap[ss.session_id]?.[ss.user_id] ?? 0,
        noteSaveCount: ss.note_save_count,
      });

      if (!sessionScoreMap[ss.session_id]) sessionScoreMap[ss.session_id] = [];
      sessionScoreMap[ss.session_id].push(report.engagementScore);

      if (!studentSessionScores[ss.user_id]) studentSessionScores[ss.user_id] = [];
      studentSessionScores[ss.user_id].push({
        sessionId: ss.session_id,
        score: report.engagementScore,
        date: sessionInfo.start_time,
      });
    });

    // Build session trend (chronological avg)
    const trend = sessions
      .filter((s) => s.end_time && sessionScoreMap[s.id])
      .map((s) => {
        const scores = sessionScoreMap[s.id] || [];
        const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        return { date: fmtDate(s.start_time), avg };
      });
    setSessionTrend(trend);

    // Build student stats
    const stats: StudentStat[] = Object.entries(studentSessionScores).map(([uid, sessions]) => {
      const sorted = [...sessions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const scores = sorted.map((s) => s.score);
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return {
        userId: uid,
        name: profileMap[uid] || "Student",
        sessionsAttended: scores.length,
        avgScore: avg,
        scores,
        lastScore: scores[scores.length - 1],
      };
    });

    stats.sort((a, b) => b.avgScore - a.avgScore);
    setStudentStats(stats);
    setLoadingDetail(false);
  }, [sessionsByCourse]);

  // ------- Render -------

  if (authLoading || loadingOverview) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isDeptAdmin =
    profile?.institution_role === "dept_admin" ||
    profile?.institution_role === "institution_admin";

  const totalSessions = courses.reduce(
    (n, c) => n + (sessionsByCourse[c.id]?.length ?? 0),
    0
  );

  // ---- Overview ----

  if (view === "overview") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 pt-24 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                {isDeptAdmin ? "Department Analytics" : "My Analytics"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isDeptAdmin
                  ? "Engagement data across all courses in your department"
                  : "Engagement and attendance trends across your courses"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/teacher")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{courses.length}</p>
                  <p className="text-xs text-muted-foreground">Courses</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{totalSessions}</p>
                  <p className="text-xs text-muted-foreground">Sessions Run</p>
                </div>
              </CardContent>
            </Card>
            {isDeptAdmin && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <GraduationCap className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">
                      {new Set(courses.map((c) => c.teacher_user_id)).size}
                    </p>
                    <p className="text-xs text-muted-foreground">Professors</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Course list */}
          {courses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No courses found.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                Courses
              </h2>
              {courses.map((course) => {
                const sessions = sessionsByCourse[course.id] || [];
                const lastSession = sessions[sessions.length - 1];
                return (
                  <button
                    key={course.id}
                    className="w-full text-left glass-card rounded-xl p-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-4"
                    onClick={() => openCourse(course)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-foreground truncate">{course.name}</span>
                        {course.section && (
                          <Badge variant="secondary" className="text-xs shrink-0">{course.section}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {isDeptAdmin && course.teacher_name && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {course.teacher_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                        </span>
                        {lastSession && (
                          <span>Last: {fmtDate(lastSession.start_time)}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Course Detail ----

  const sessions = selectedCourse ? sessionsByCourse[selectedCourse.id] || [] : [];
  const avgScore =
    studentStats.length > 0
      ? Math.round(studentStats.reduce((s, r) => s + r.avgScore, 0) / studentStats.length)
      : 0;
  const totalStudents = studentStats.length;
  const sessionCount = sessions.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 pt-24 space-y-6">

        {/* Back + header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("overview")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{selectedCourse?.name}</h1>
            {selectedCourse?.section && (
              <p className="text-sm text-muted-foreground">{selectedCourse.section}</p>
            )}
            {isDeptAdmin && selectedCourse?.teacher_name && (
              <p className="text-xs text-muted-foreground">Prof. {selectedCourse.teacher_name}</p>
            )}
          </div>
        </div>

        {loadingDetail ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No completed sessions yet for this course.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">{avgScore}</p>
                    <p className="text-xs text-muted-foreground">Avg Engagement</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">{totalStudents}</p>
                    <p className="text-xs text-muted-foreground">Unique Students</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">{sessionCount}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Engagement trend chart */}
            {sessionTrend.length > 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Class Engagement Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={sessionTrend} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`${v}`, "Avg Score"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "hsl(var(--primary))" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Session-by-session bar chart if only 1 session */}
            {sessionTrend.length === 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Student Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={studentStats.map((s) => ({ name: s.name.split(" ")[0], score: s.avgScore }))}
                      margin={{ top: 5, right: 16, bottom: 5, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`${v}`, "Score"]}
                      />
                      <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Student Roster */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Student Roster
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-center">Sessions</TableHead>
                      <TableHead className="text-center">Avg Score</TableHead>
                      <TableHead className="text-center">Last Score</TableHead>
                      <TableHead className="text-center">Trend</TableHead>
                      <TableHead className="text-right">Report</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentStats.map((s) => (
                      <TableRow key={s.userId}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm">
                            {s.sessionsAttended}/{sessionCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <ScoreBadge score={s.avgScore} />
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm text-muted-foreground">{s.lastScore}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <TrendArrow scores={s.scores} />
                        </TableCell>
                        <TableCell className="text-right">
                          {sessions.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                navigate(
                                  `/teacher/session/${sessions[sessions.length - 1].id}/report`
                                )
                              }
                            >
                              <BarChart3 className="h-3 w-3 mr-1" /> Latest
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Session history */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Session History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Students</TableHead>
                      <TableHead className="text-right">Report</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...sessions].reverse().map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          {new Date(s.start_time).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {studentStats.filter(
                            (st) => st.scores.length > 0
                          ).length > 0
                            ? "—"
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => navigate(`/teacher/session/${s.id}/report`)}
                          >
                            <BarChart3 className="h-3 w-3 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
