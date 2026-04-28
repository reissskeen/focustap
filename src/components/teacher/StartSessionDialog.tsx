import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface StartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Tables<"courses">[];
  userId: string;
  onSessionStarted: (session: Tables<"sessions">) => void;
}

const DURATION_OPTIONS = [
  { label: "Auto (from class schedule)", value: "auto" },
  { label: "50 min", value: "50" },
  { label: "1 hr 15 min", value: "75" },
  { label: "Custom", value: "custom" },
  { label: "No limit", value: "none" },
];

const CUTOFF_OPTIONS = [
  { label: "No cutoff", value: "none" },
  { label: "10 min", value: "10" },
  { label: "15 min", value: "15" },
  { label: "20 min", value: "20" },
];

const StartSessionDialog = ({
  open,
  onOpenChange,
  courses,
  userId,
  onSessionStarted,
}: StartSessionDialogProps) => {
  const [courseId, setCourseId] = useState("");
  const [roomId, setRoomId] = useState("none");
  const [duration, setDuration] = useState("50");
  const [customDuration, setCustomDuration] = useState("");
  const [cutoff, setCutoff] = useState("none");
  const [rooms, setRooms] = useState<Tables<"rooms">[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.from("rooms").select("*").then(({ data }) => {
        if (data) setRooms(data);
      });
      if (courses.length === 1) setCourseId(courses[0].id);
    }
  }, [open, courses]);

  // When the selected course changes, default duration to "auto" if it has a schedule
  useEffect(() => {
    const selected = courses.find((c) => c.id === courseId);
    if (selected?.end_time) {
      setDuration("auto");
    }
  }, [courseId, courses]);

  const handleStart = async () => {
    if (!courseId) {
      toast.error("Please select a course");
      return;
    }
    setLoading(true);

    const now = new Date();
    const selectedCourse = courses.find((c) => c.id === courseId);

    let endTime: string | null = null;
    if (duration === "auto" && selectedCourse?.end_time) {
      // Derive session end from the course's configured clock time (today's date)
      const [eh, em] = (selectedCourse.end_time as string).split(":").map(Number);
      const courseEnd = new Date();
      courseEnd.setHours(eh, em, 0, 0);
      endTime = courseEnd.toISOString();
    } else {
      const durationMinutes =
        duration === "custom"
          ? parseInt(customDuration) || 60
          : duration === "none"
          ? null
          : parseInt(duration);
      endTime = durationMinutes
        ? new Date(now.getTime() + durationMinutes * 60000).toISOString()
        : null;
    }

    const cutoffMinutes = cutoff === "none" ? null : parseInt(cutoff);
    const lateJoinCutoff = cutoffMinutes
      ? new Date(now.getTime() + cutoffMinutes * 60000).toISOString()
      : null;

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        course_id: courseId,
        room_id: roomId === "none" ? null : roomId,
        start_time: now.toISOString(),
        end_time: endTime,
        late_join_cutoff: lateJoinCutoff,
        status: "active",
        created_by: userId,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast.error("Failed to start session: " + error.message);
      return;
    }

    toast.success("Session started!");
    onOpenChange(false);
    onSessionStarted(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Start Session</DialogTitle>
          <DialogDescription>
            Configure your class session settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Course */}
          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}{c.section ? ` · ${c.section}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room */}
          {rooms.length > 0 && (
            <div className="space-y-2">
              <Label>Room (optional)</Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="No room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No room</SelectItem>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Duration */}
          <div className="space-y-2">
            <Label>Session Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {duration === "auto" && (() => {
              const sel = courses.find((c) => c.id === courseId);
              if (!sel?.end_time) return null;
              const [eh, em] = (sel.end_time as string).split(":").map(Number);
              const label = new Date();
              label.setHours(eh, em, 0, 0);
              return (
                <p className="text-xs text-muted-foreground mt-1">
                  Ends at {label.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} (from class schedule)
                </p>
              );
            })()}
            {duration === "custom" && (
              <Input
                type="number"
                placeholder="Minutes"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Late-join cutoff */}
          <div className="space-y-2">
            <Label>Late-Join Cutoff</Label>
            <Select value={cutoff} onValueChange={setCutoff}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUTOFF_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={loading}>
            {loading ? "Starting…" : "Start Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartSessionDialog;
