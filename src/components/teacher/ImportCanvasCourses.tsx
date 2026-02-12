import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

interface CanvasCourse {
  canvas_id: string;
  name: string;
  course_code: string | null;
  already_imported: boolean;
}

interface ImportCanvasCoursesProps {
  onCoursesImported: (courses: Tables<"courses">[]) => void;
}

const ImportCanvasCourses = ({ onCoursesImported }: ImportCanvasCoursesProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [canvasCourses, setCanvasCourses] = useState<CanvasCourse[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    setCanvasCourses([]);
    setSelected(new Set());

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("canvas-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.error) throw new Error(res.error.message);

      const data = res.data as { courses?: CanvasCourse[]; error?: string };
      if (data.error) {
        setError(data.error);
      } else {
        setCanvasCourses(data.courses || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch Canvas courses");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setDialogOpen(true);
    fetchCourses();
  };

  const toggleSelect = (canvasId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(canvasId)) next.delete(canvasId);
      else next.add(canvasId);
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);

    const coursesToImport = canvasCourses
      .filter((c) => selected.has(c.canvas_id))
      .map((c) => ({ canvas_id: c.canvas_id, name: c.name, course_code: c.course_code }));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await supabase.functions.invoke("canvas-import", {
        headers: { Authorization: `Bearer ${token}` },
        body: { courses: coursesToImport },
      });

      if (res.error) throw new Error(res.error.message);

      const data = res.data as { imported?: Tables<"courses">[]; error?: string; message?: string };
      if (data.error) throw new Error(data.error);

      const imported = data.imported || [];
      if (imported.length > 0) {
        onCoursesImported(imported);
        toast({ title: `Imported ${imported.length} course${imported.length !== 1 ? "s" : ""}` });
      } else {
        toast({ title: data.message || "No new courses to import" });
      }

      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const availableCount = canvasCourses.filter((c) => !c.already_imported).length;

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={handleOpen}>
        <Download className="w-4 h-4" /> Import from Canvas
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import from Canvas</DialogTitle>
            <DialogDescription>
              Select courses to import from your Canvas account.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto space-y-1">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Fetching courses…</span>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive py-4 text-center">{error}</p>
            )}

            {!loading && !error && canvasCourses.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No courses found on Canvas.
              </p>
            )}

            {canvasCourses.map((course) => (
              <label
                key={course.canvas_id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  course.already_imported
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-accent cursor-pointer"
                }`}
              >
                <Checkbox
                  checked={course.already_imported || selected.has(course.canvas_id)}
                  disabled={course.already_imported}
                  onCheckedChange={() => toggleSelect(course.canvas_id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{course.name}</p>
                  {course.course_code && (
                    <p className="text-xs text-muted-foreground">{course.course_code}</p>
                  )}
                </div>
                {course.already_imported && (
                  <Badge variant="secondary" className="text-xs shrink-0">Imported</Badge>
                )}
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className="gap-2"
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              Import {selected.size > 0 ? `(${selected.size})` : "Selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportCanvasCourses;
