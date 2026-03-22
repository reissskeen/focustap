/**
 * FocusTap Engagement Index (FEI)
 *
 * Proprietary 4-component scoring algorithm:
 *
 *   Presence              (35%) — ratio of focused tab time to session duration
 *   Distraction Resistance(30%) — penalizes frequent tab-switching interruptions
 *   Active Participation  (25%) — note-taking signals genuine cognitive engagement
 *   Session Integrity     (10%) — rewards on-time arrival and sustained presence
 *
 * The Active Participation signal is unique to FocusTap. It requires an integrated
 * notes editor and cannot be replicated by competitors using tab-visibility alone.
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
  pauseCount?: number;     // number of tab-switch interruptions (from focus_events)
  noteSaveCount?: number;  // number of note autosaves this session (from student_sessions)
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
  // FEI component breakdown (0–100 each)
  presenceScore: number;
  distractionResistanceScore: number;
  activeParticipationScore: number;
  sessionIntegrityScore: number;
}

export function computeStudentReport(m: StudentMetrics): StudentReport {
  const sessionStart = new Date(m.sessionStartTime).getTime();
  const sessionEnd = new Date(m.sessionEndTime).getTime();
  const joinTime = new Date(m.joinedAt).getTime();
  const lastPingTime = m.lastPing ? new Date(m.lastPing).getTime() : joinTime;

  const sessionDurationSeconds = Math.max(1, Math.round((sessionEnd - sessionStart) / 1000));
  const sessionDurationMinutes = sessionDurationSeconds / 60;
  const focusRatio = Math.min(1, m.focusSeconds / sessionDurationSeconds);

  // On-time: joined within 2 minutes of start
  const graceMs = 2 * 60 * 1000;
  const arrivedOnTime = joinTime <= sessionStart + graceMs;

  // Active until end: last ping within 60s of session end
  const endGraceMs = 60 * 1000;
  const activeUntilEnd = lastPingTime >= sessionEnd - endGraceMs;

  const attendanceStatus: "present" | "late" = arrivedOnTime ? "present" : "late";

  // --- FEI Components ---

  // 1. Presence (35%): ratio of time tab was in foreground
  const presenceScore = focusRatio;

  // 2. Distraction Resistance (30%): penalize frequent tab switches
  // Baseline: 1 distraction per 5 minutes is considered normal; more = lower score
  const pauseCount = m.pauseCount ?? 0;
  const maxExpectedPauses = Math.max(1, sessionDurationMinutes / 5);
  const distractionResistanceScore = Math.max(0, 1 - pauseCount / maxExpectedPauses);

  // 3. Active Participation (25%): note-taking engagement
  // Target: 1 save per 10 minutes of class = fully engaged
  const noteSaveCount = m.noteSaveCount ?? 0;
  const targetSaves = Math.max(1, sessionDurationMinutes / 10);
  const activeParticipationScore = Math.min(1, noteSaveCount / targetSaves);

  // 4. Session Integrity (10%): arrival punctuality + persistence
  // Arrival: full credit on time, linear decay up to 15 min late then 0
  const lateMs = Math.max(0, joinTime - (sessionStart + graceMs));
  const arrivalScore = Math.max(0, 1 - lateMs / (15 * 60 * 1000));
  // Persistence: how far into the session did the last heartbeat reach?
  const sessionSpanMs = Math.max(1, sessionEnd - sessionStart);
  const persistenceScore = Math.min(1, Math.max(0, (lastPingTime - sessionStart) / sessionSpanMs));
  const sessionIntegrityScore = (arrivalScore + persistenceScore) / 2;

  // Weighted FEI
  const engagementScore = Math.round(
    (presenceScore * 0.35 +
      distractionResistanceScore * 0.30 +
      activeParticipationScore * 0.25 +
      sessionIntegrityScore * 0.10) *
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
    presenceScore: Math.round(presenceScore * 100),
    distractionResistanceScore: Math.round(distractionResistanceScore * 100),
    activeParticipationScore: Math.round(activeParticipationScore * 100),
    sessionIntegrityScore: Math.round(sessionIntegrityScore * 100),
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
