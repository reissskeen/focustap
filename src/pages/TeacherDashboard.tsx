import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Clock,
  BarChart3,
  Play,
  QrCode,
  Download,
  Eye,
  Pause,
  UserCheck,
  Zap,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

interface MockStudent {
  id: string;
  name: string;
  status: "active" | "paused" | "joined";
  focusSeconds: number;
  joinedAt: string;
}

const mockStudents: MockStudent[] = [
  { id: "1", name: "Alex Chen", status: "active", focusSeconds: 1842, joinedAt: "9:01 AM" },
  { id: "2", name: "Jordan Smith", status: "active", focusSeconds: 1756, joinedAt: "9:00 AM" },
  { id: "3", name: "Maya Patel", status: "paused", focusSeconds: 1523, joinedAt: "9:02 AM" },
  { id: "4", name: "Sam Williams", status: "active", focusSeconds: 1698, joinedAt: "9:01 AM" },
  { id: "5", name: "Lily Nguyen", status: "active", focusSeconds: 1810, joinedAt: "9:00 AM" },
  { id: "6", name: "Ethan Brown", status: "paused", focusSeconds: 920, joinedAt: "9:05 AM" },
  { id: "7", name: "Sophia Davis", status: "active", focusSeconds: 1601, joinedAt: "9:01 AM" },
  { id: "8", name: "Lucas Martinez", status: "joined", focusSeconds: 0, joinedAt: "9:12 AM" },
];

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

const StatusDot = ({ status }: { status: MockStudent["status"] }) => {
  const colors = {
    active: "bg-focus-active",
    paused: "bg-focus-paused",
    joined: "bg-focus-inactive",
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status]}`} />;
};

const TeacherDashboard = () => {
  const [sessionStarted, setSessionStarted] = useState(true);
  const [showQR, setShowQR] = useState(false);

  const activeCount = mockStudents.filter((s) => s.status === "active").length;
  const avgFocus = Math.round(
    mockStudents.reduce((sum, s) => sum + s.focusSeconds, 0) / mockStudents.length
  );

  const stats = [
    { icon: Users, label: "Students", value: `${mockStudents.length}` },
    { icon: UserCheck, label: "Active", value: `${activeCount}` },
    { icon: Clock, label: "Avg Focus", value: formatTime(avgFocus) },
    { icon: BarChart3, label: "Participation", value: `${Math.round((activeCount / mockStudents.length) * 100)}%` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="font-display text-2xl font-bold">AP Computer Science</h1>
              <p className="text-sm text-muted-foreground">Section A · Feb 10, 2026 · Period 3</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowQR(!showQR)}
              >
                <QrCode className="w-4 h-4" />
                {showQR ? "Hide QR" : "Show QR"}
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  setSessionStarted(!sessionStarted);
                  toast.success(sessionStarted ? "Session ended" : "Session started");
                }}
              >
                {sessionStarted ? (
                  <><Pause className="w-4 h-4" /> End Session</>
                ) : (
                  <><Play className="w-4 h-4" /> Start Session</>
                )}
              </Button>
            </div>
          </motion.div>

          {/* QR Code */}
          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-8"
            >
              <div className="glass-card rounded-xl p-8 flex flex-col items-center">
                <QRCodeSVG
                  value={`${window.location.origin}/launch?session_id=demo-123`}
                  size={200}
                  bgColor="transparent"
                  fgColor="hsl(200 25% 10%)"
                  level="M"
                />
                <p className="mt-4 text-sm text-muted-foreground">Scan to join session</p>
                <p className="mt-1 text-xs text-muted-foreground font-mono break-all max-w-[250px] text-center">
                  {window.location.origin}/launch?session_id=demo-123
                </p>
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

          {/* Student Roster */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-display font-semibold">Live Roster</h2>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Student</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Focus Time</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Joined</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockStudents.map((student) => (
                    <tr key={student.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-sm">{student.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusDot status={student.status} />
                          <span className="text-sm capitalize text-muted-foreground">{student.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{formatTime(student.focusSeconds)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{student.joinedAt}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          <Eye className="w-3.5 h-3.5" /> View Notes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
