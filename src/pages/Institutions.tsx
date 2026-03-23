import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Building2, Copy, Check } from "lucide-react";

interface Institution {
  id: string;
  name: string;
  student_code: string;
  teacher_code: string;
  active: boolean;
  created_at: string;
}

function generateCode(prefix: string, type: "STU" | "PROF") {
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${type}-${rand}`;
}

export default function Institutions() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { loadInstitutions(); }, []);

  const loadInstitutions = async () => {
    const { data } = await supabase
      .from("institutions")
      .select("*")
      .order("created_at", { ascending: false });
    setInstitutions((data as Institution[]) || []);
    setLoading(false);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    const prefix = value.trim().toUpperCase().replace(/\s+/g, "-").substring(0, 8);
    if (prefix) {
      setStudentCode(generateCode(prefix, "STU"));
      setTeacherCode(generateCode(prefix, "PROF"));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !studentCode || !teacherCode) return;
    setCreating(true);
    const { error } = await supabase
      .from("institutions")
      .insert({ name, student_code: studentCode, teacher_code: teacherCode });
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${name} created successfully`);
    setShowForm(false);
    setName("");
    setStudentCode("");
    setTeacherCode("");
    loadInstitutions();
  };

  const toggleActive = async (inst: Institution) => {
    await supabase.from("institutions").update({ active: !inst.active }).eq("id", inst.id);
    loadInstitutions();
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Institutions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage school access codes for students and professors
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Institution
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">New Institution</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Institution Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Flagler College"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentCode">Student Code</Label>
                    <Input
                      id="studentCode"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacherCode">Professor Code</Label>
                    <Input
                      id="teacherCode"
                      value={teacherCode}
                      onChange={(e) => setTeacherCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating…" : "Create Institution"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : institutions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No institutions yet. Add one to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {institutions.map((inst) => (
              <Card key={inst.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{inst.name}</h3>
                        <Badge variant={inst.active ? "default" : "secondary"} className="text-xs">
                          {inst.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-xs text-muted-foreground mb-1">Student Code</p>
                          <div className="flex items-center gap-1.5">
                            <code className="text-sm font-mono font-medium text-foreground">{inst.student_code}</code>
                            <button
                              onClick={() => copyCode(inst.student_code)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copied === inst.student_code ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-xs text-muted-foreground mb-1">Professor Code</p>
                          <div className="flex items-center gap-1.5">
                            <code className="text-sm font-mono font-medium text-foreground">{inst.teacher_code}</code>
                            <button
                              onClick={() => copyCode(inst.teacher_code)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copied === inst.teacher_code ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(inst)}
                      className="shrink-0"
                    >
                      {inst.active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
