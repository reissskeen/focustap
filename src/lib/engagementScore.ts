/**
 * Engagement Score Calculator
 * 
 * Weighted composite: 
 *   Focus ratio (60%) + On-time arrival (20%) + Active until end (20%)
 * 
 * Returns 0–100 score.
 */

export interface StudentMetrics {
  name: string;
  seatLabel: string;
  focusSeconds: number;
  joinedAt: string;
  lastPing: string | null;
  sessionStartTime: string;
  sessionEndTime: string;
}

export interface StudentReport {
  name: string;
  seatLabel: string;
  focusSeconds: number;
  sessionDurationSeconds: number;
  focusRatio: number; // 0–1
  arrivedOnTime: boolean;
  activeUntilEnd: boolean;
  engagementScore: number; // 0–100
  attendanceStatus: "present" | "late" | "absent";
}

export function computeStudentReport(m: StudentMetrics): StudentReport {
  const sessionStart = new Date(m.sessionStartTime).getTime();
  const sessionEnd = new Date(m.sessionEndTime).getTime();
  const joinTime = new Date(m.joinedAt).getTime();
  const lastPingTime = m.lastPing ? new Date(m.lastPing).getTime() : joinTime;

  const sessionDurationSeconds = Math.max(1, Math.round((sessionEnd - sessionStart) / 1000));
  const focusRatio = Math.min(1, m.focusSeconds / sessionDurationSeconds);

  // On-time: joined within 2 minutes of start
  const graceMs = 2 * 60 * 1000;
  const arrivedOnTime = joinTime <= sessionStart + graceMs;

  // Active until end: last ping within 60s of session end
  const endGraceMs = 60 * 1000;
  const activeUntilEnd = lastPingTime >= sessionEnd - endGraceMs;

  const attendanceStatus: "present" | "late" = arrivedOnTime ? "present" : "late";

  // Weighted score
  const focusWeight = 0.6;
  const arrivalWeight = 0.2;
  const activeWeight = 0.2;

  const engagementScore = Math.round(
    (focusRatio * focusWeight +
      (arrivedOnTime ? 1 : 0) * arrivalWeight +
      (activeUntilEnd ? 1 : 0) * activeWeight) *
      100
  );

  return {
    name: m.name,
    seatLabel: m.seatLabel,
    focusSeconds: m.focusSeconds,
    sessionDurationSeconds,
    focusRatio,
    arrivedOnTime,
    activeUntilEnd,
    engagementScore,
    attendanceStatus,
  };
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "hsl(152, 69%, 45%)"; // green
  if (score >= 50) return "hsl(38, 92%, 50%)"; // amber
  return "hsl(0, 72%, 51%)"; // red
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Improvement";
}
