import { useState } from "react";
import { ButtonColorful } from "@/components/ui/button-colorful";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface CreateCourseFormProps {
  userId: string;
  onCourseCreated: (course: Tables<"courses">) => void;
}

const CreateCourseForm = ({ userId, onCourseCreated }: CreateCourseFormProps) => {
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .insert({ name: name.trim(), section: section.trim() || null, teacher_user_id: userId })
      .select()
      .single();

    setLoading(false);
    if (error) {
      toast.error("Failed to create course: " + error.message);
      return;
    }
    toast.success("Course created!");
    setName("");
    setSection("");
    onCourseCreated(data);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-4">
      <h2 className="font-display font-semibold text-lg">Create Your First Course</h2>
      <p className="text-sm text-muted-foreground">Add a course to get started with sessions.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="course-name">Course Name</Label>
          <Input
            id="course-name"
            placeholder="e.g. AP Computer Science"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-section">Section (optional)</Label>
          <Input
            id="course-section"
            placeholder="e.g. Section A"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          />
        </div>
      </div>
      <ButtonColorful type="submit" disabled={loading} className="gap-2">
        <Plus className="w-4 h-4" />
        {loading ? "Creating…" : "Create Course"}
      </ButtonColorful>
    </form>
  );
};

export default CreateCourseForm;
