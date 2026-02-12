export type AttendanceStatus = "present" | "late" | "absent";
export type StudentActivityStatus = "active" | "paused" | "disconnected";

export function getAttendanceStatus(
  joinedAt: string,
  sessionStartTime: string,
  lateJoinCutoff: string | null
): AttendanceStatus {
  if (!lateJoinCutoff) return "present";
  const joinTime = new Date(joinedAt).getTime();
  const cutoff = new Date(lateJoinCutoff).getTime();
  const start = new Date(sessionStartTime).getTime();
  // "Late" = joined after the late cutoff window
  // Use a grace period of 5 minutes after start as "on time"
  const graceMs = 5 * 60 * 1000;
  if (joinTime <= start + graceMs) return "present";
  if (joinTime <= cutoff) return "late";
  return "late"; // still joined, but after grace
}

export function getActivityStatus(lastHeartbeat: string | null): StudentActivityStatus {
  if (!lastHeartbeat) return "disconnected";
  const elapsed = Date.now() - new Date(lastHeartbeat).getTime();
  if (elapsed < 20000) return "active"; // within 20s
  if (elapsed < 45000) return "paused"; // 20-45s
  return "disconnected"; // > 45s
}

export function exportRosterCSV(
  roster: Array<{
    display_name: string;
    focus_seconds: number;
    joined_at: string;
    last_heartbeat: string | null;
  }>,
  sessionStartTime: string,
  lateJoinCutoff: string | null,
  courseName: string
) {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const header = "Student,Status,Attendance,Focus Time,Joined At\n";
  const rows = roster.map((s) => {
    const activity = getActivityStatus(s.last_heartbeat);
    const attendance = getAttendanceStatus(s.joined_at, sessionStartTime, lateJoinCutoff);
    return `"${s.display_name}",${activity},${attendance},${formatTime(s.focus_seconds)},${new Date(s.joined_at).toLocaleString()}`;
  });

  const csv = header + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${courseName.replace(/\s+/g, "_")}_attendance.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
