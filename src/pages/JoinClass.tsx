import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Play, Loader2, Clock, Users, ChevronRight, QrCode, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ActiveSession {
  session_id: string;
  course_name: string;
  section: string | null;
  start_time: string;
  student_count: number;
}

const JoinClass = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchActiveSessions = async () => {
      // Get all active sessions with their course info
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, start_time, course_id, courses(name, section)")
        .eq("status", "active");

      if (sessions) {
        // Get student counts for each session
        const sessionIds = sessions.map((s) => s.id);
        const { data: studentCounts } = await supabase
          .from("student_sessions")
          .select("session_id")
          .in("session_id", sessionIds);

        const countMap = new Map<string, number>();
        (studentCounts || []).forEach((sc) => {
          countMap.set(sc.session_id, (countMap.get(sc.session_id) || 0) + 1);
        });

        const mapped: ActiveSession[] = sessions.map((s) => {
          const course = s.courses as any;
          return {
            session_id: s.id,
            course_name: course?.name ?? "Unknown Course",
            section: course?.section ?? null,
            start_time: s.start_time,
            student_count: countMap.get(s.id) || 0,
          };
        });

        setActiveSessions(mapped);
      }

      setLoading(false);
    };

    fetchActiveSessions();

    // Poll for new sessions every 15 seconds
    const interval = setInterval(fetchActiveSessions, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleJoin = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mb-3 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="font-display text-2xl font-bold mb-1">Join a Class</h1>
            <p className="text-sm text-muted-foreground">
              Select an active session below, or scan a QR code / tap an NFC tag in your classroom.
            </p>
          </motion.div>

          {/* Active Sessions */}
          {activeSessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card rounded-xl p-10 text-center"
            >
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
              <h2 className="font-display text-lg font-semibold mb-2">No Active Classes</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                There are no classes in session right now. Check back when your professor starts one, or use a QR code / NFC tag.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <QrCode className="w-4 h-4" />
                <span>You can also scan a classroom QR code to join</span>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session, i) => (
                <motion.div
                  key={session.session_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * (i + 1) }}
                >
                  <button
                    onClick={() => handleJoin(session.session_id)}
                    className="w-full glass-card rounded-xl p-5 text-left hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <motion.div
                            className="w-2.5 h-2.5 rounded-full bg-focus-active flex-shrink-0"
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          />
                          <span className="text-xs font-medium text-focus-active">Live Now</span>
                        </div>
                        <h3 className="font-display text-lg font-semibold truncate">
                          {session.course_name}
                        </h3>
                        {session.section && (
                          <p className="text-sm text-muted-foreground">{session.section}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Started {formatDistanceToNow(new Date(session.start_time), { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {session.student_count} joined
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button size="sm" className="gap-1.5 group-hover:gap-2 transition-all">
                          <Play className="w-4 h-4" />
                          Join
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Tip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center text-xs text-muted-foreground"
          >
            <p>Sessions refresh automatically. Your professor will start the session when class begins.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default JoinClass;
