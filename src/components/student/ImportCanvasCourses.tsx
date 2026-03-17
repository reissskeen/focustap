import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, BookOpen, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CanvasCourse {
  canvas_course_id: string;
  name: string;
  course_code: string | null;
  term: string | null;
  platform_course_id: string | null;
  platform_course_name: string | null;
  already_joined: boolean;
}

interface ImportCanvasCoursesProps {
  onCoursesImported: () => void;
}

const ImportCanvasCourses = ({ onCoursesImported }: ImportCanvasCoursesProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  const { toast } = useToast();

  const fetchCanvasCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("student-canvas-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.error) {
        setError(res.error.message || "Failed to fetch courses");
      } else if (res.data?.error) {
        setError(res.data.error);
        setCourses(res.data.courses || []);
      } else {
        setCourses(res.data.courses || []);
      }
      setFetched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !fetched) {
      fetchCanvasCourses();
    }
  };

  const availableCourses = courses.filter((c) => c.platform_course_id);
  const unavailableCourses = courses.filter((c) => !c.platform_course_id);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="w-4 h-4" /> Import from Canvas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Import Canvas Courses</DialogTitle>
          <DialogDescription>
            Your enrolled Canvas courses are shown below. Courses available on the platform can be joined directly.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Fetching your Canvas courses…</span>
          </div>
        ) : error && courses.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchCanvasCourses}>
              Retry
            </Button>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No Canvas courses found for your account.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {availableCourses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Available on Platform</p>
                {availableCourses.map((course) => (
                  <motion.div
                    key={course.canvas_course_id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{course.name}</p>
                      {course.course_code && (
                        <p className="text-xs text-muted-foreground">{course.course_code}</p>
                      )}
                      {course.term && (
                        <p className="text-xs text-muted-foreground">{course.term}</p>
                      )}
                    </div>
                    {course.already_joined ? (
                      <span className="flex items-center gap-1 text-xs text-focus-active font-medium">
                        <Check className="w-3.5 h-3.5" /> Joined
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Available</span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {unavailableCourses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Not yet on platform</p>
                {unavailableCourses.map((course) => (
                  <div
                    key={course.canvas_course_id}
                    className="flex items-center justify-between rounded-lg border border-dashed p-3 opacity-60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{course.name}</p>
                      {course.course_code && (
                        <p className="text-xs text-muted-foreground">{course.course_code}</p>
                      )}
                      {course.term && (
                        <p className="text-xs text-muted-foreground">{course.term}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportCanvasCourses;
