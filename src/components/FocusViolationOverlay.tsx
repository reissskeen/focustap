import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ArrowLeft } from "lucide-react";

interface FocusViolationOverlayProps {
  active: boolean;
  violationCount: number;
  suspended: boolean;
  countdownSeconds?: number;
  onDismiss: () => void;
  onExpired: () => void;
}

const PURPLE = "#8b6cff";
const RED = "#ef4444";

// Radius and circumference for the SVG countdown ring
const R = 36;
const CIRC = 2 * Math.PI * R;

export default function FocusViolationOverlay({
  active,
  violationCount,
  suspended,
  countdownSeconds = 10,
  onDismiss,
  onExpired,
}: FocusViolationOverlayProps) {
  const [countdown, setCountdown] = useState(countdownSeconds);
  // Stable ref so the interval closure always sees the latest callback.
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  // Reset and run the countdown whenever the overlay becomes active.
  useEffect(() => {
    if (!active) return;
    setCountdown(countdownSeconds);

    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          onExpiredRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [active, countdownSeconds]);

  const dashFill = CIRC * (countdown / countdownSeconds);
  const urgentColor = countdown <= 3 ? RED : PURPLE;

  return (
    <AnimatePresence>
      {(active || suspended) && (
        <motion.div
          key="focus-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(9,9,15,0.93)",
            backdropFilter: "blur(14px)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 18 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            style={{
              background: suspended
                ? "rgba(239,68,68,0.08)"
                : "rgba(239,68,68,0.05)",
              border: `1px solid ${suspended
                ? "rgba(239,68,68,0.40)"
                : "rgba(239,68,68,0.22)"}`,
              borderRadius: 24,
              padding: "40px 36px",
              maxWidth: 400,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              textAlign: "center",
            }}
          >
            {/* Warning icon */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <AlertTriangle style={{ width: 30, height: 30, color: RED }} />
            </div>

            {/* Title + body */}
            <div>
              <h2 style={{
                color: "#e8e8f0",
                fontSize: 20,
                fontWeight: 700,
                margin: "0 0 10px",
                fontFamily: "inherit",
              }}>
                {suspended ? "Session Suspended" : "Focus Interrupted"}
              </h2>
              <p style={{
                color: "#8585a0",
                fontSize: 14,
                margin: 0,
                lineHeight: 1.55,
              }}>
                {suspended
                  ? "You left the session too long. Your professor has been notified."
                  : <>
                      You navigated away from the session.
                      {violationCount > 1 && (
                        <span style={{ color: RED }}> Violation #{violationCount}. </span>
                      )}
                      {" "}Return now or the session will be suspended.
                    </>}
              </p>
            </div>

            {/* SVG countdown ring — only shown while active (not suspended) */}
            {!suspended && (
              <div style={{ position: "relative", width: 88, height: 88 }}>
                <svg
                  width={88}
                  height={88}
                  style={{ transform: "rotate(-90deg)", display: "block" }}
                >
                  {/* Track */}
                  <circle
                    cx={44} cy={44} r={R}
                    fill="none"
                    stroke="rgba(239,68,68,0.10)"
                    strokeWidth={5}
                  />
                  {/* Progress arc */}
                  <circle
                    cx={44} cy={44} r={R}
                    fill="none"
                    stroke={urgentColor}
                    strokeWidth={5}
                    strokeDasharray={`${dashFill} ${CIRC}`}
                    strokeLinecap="round"
                    style={{
                      transition: "stroke-dasharray 0.9s linear, stroke 0.3s",
                    }}
                  />
                </svg>
                <span style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 700,
                  color: countdown <= 3 ? RED : "#e8e8f0",
                  fontFamily: "inherit",
                  lineHeight: 1,
                }}>
                  {countdown}
                </span>
              </div>
            )}

            {/* Action button */}
            {!suspended && (
              <button
                onClick={onDismiss}
                style={{
                  width: "100%",
                  padding: "13px 0",
                  borderRadius: 12,
                  background: PURPLE,
                  border: "none",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#7155e8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = PURPLE)}
              >
                <ArrowLeft style={{ width: 16, height: 16 }} />
                Return to Session
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
