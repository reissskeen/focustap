import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, Building2, Copy, Check, ChevronDown, ChevronUp,
  Users, GraduationCap, ShieldCheck, Crown,
} from "lucide-react";

interface Institution {
  id: string;
  name: string;
  student_code: string;
  teacher_code: string;
  active: boolean;
  created_at: string;
}

interface Professor {
  user_id: string;
  display_name: string | null;
  institution_role: string;
}

type InstitutionRole = "teacher" | "dept_admin" | "institution_admin";

const ROLE_CONFIG: Record<InstitutionRole, { label: string; icon: React.ReactNode; color: string }> = {
  teacher: {
    label: "Professor",
    icon: <GraduationCap className="h-3.5 w-3.5" />,
    color: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  dept_admin: {
    label: "Dept. Chair",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  institution_admin: {
    label: "President",
    icon: <Crown className="h-3.5 w-3.5" />,
    color: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role as InstitutionRole] ?? ROLE_CONFIG.teacher;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [professors, setProfessors] = useState<Record<string, Professor[]>>({});
  const [loadingProfs, setLoadingProfs] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => { loadInstitutions(); }, []);

  const loadInstitutions = async () => {
    const { data } = await supabase
      .from("institutions")
      .select("*")
      .order("created_at", { ascending: false });
    setInstitutions((data as Institution[]) || []);
    setLoading(false);
  };

  const loadProfessors = async (instId: string) => {
    if (professors[instId]) return;
    setLoadingProfs(instId);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, institution_role")
      .eq("institution_id", instId)
      .in("institution_role", ["teacher", "dept_admin", "institution_admin"]);
    setProfessors((prev) => ({ ...prev, [instId]: (data as Professor[]) || [] }));
    setLoadingProfs(null);
  };

  const toggleExpand = (instId: string) => {
    if (expandedId === instId) {
      setExpandedId(null);
    } else {
      setExpandedId(instId);
      loadProfessors(instId);
    }
  };

  const handleRoleChange = async (instId: string, userId: string, newRole: InstitutionRole) => {
    setUpdatingRole(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ institution_role: newRole })
      .eq("user_id", userId)
      .eq("institution_id", instId);

    if (error) {
      toast.error("Failed to update role");
    } else {
      setProfessors((prev) => ({
        ...prev,
        [instId]: prev[instId].map((p) =>
          p.user_id === userId ? { ...p, institution_role: newRole } : p
        ),
      }));
      toast.success(`Role updated to ${ROLE_CONFIG[newRole].label}`);
    }
    setUpdatingRole(null);
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
    if (error) { toast.error(error.message); return; }
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
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Institutions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage schools, access codes, and professor roles
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Institution
          </Button>
        </div>

        {/* Create form */}
        {showForm && (
          <Card>
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

        {/* Institution list */}
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
            {institutions.map((inst) => {
              const isExpanded = expandedId === inst.id;
              const profs = professors[inst.id] || [];

              return (
                <Card key={inst.id} className="overflow-hidden">
                  <CardContent className="p-4">

                    {/* Top row: name + status + deactivate */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{inst.name}</h3>
                        <Badge variant={inst.active ? "default" : "secondary"} className="text-xs">
                          {inst.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-muted-foreground hover:text-foreground"
                          onClick={() => toggleExpand(inst.id)}
                        >
                          <Users className="h-3.5 w-3.5" />
                          Staff
                          {isExpanded
                            ? <ChevronUp className="h-3.5 w-3.5" />
                            : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(inst)}
                        >
                          {inst.active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>

                    {/* Access codes */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground mb-1">Student Code</p>
                        <div className="flex items-center gap-1.5">
                          <code className="text-sm font-mono font-medium text-foreground flex-1 truncate">
                            {inst.student_code}
                          </code>
                          <button
                            onClick={() => copyCode(inst.student_code)}
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          >
                            {copied === inst.student_code
                              ? <Check className="h-3.5 w-3.5 text-green-500" />
                              : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground mb-1">Professor Code</p>
                        <div className="flex items-center gap-1.5">
                          <code className="text-sm font-mono font-medium text-foreground flex-1 truncate">
                            {inst.teacher_code}
                          </code>
                          <button
                            onClick={() => copyCode(inst.teacher_code)}
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          >
                            {copied === inst.teacher_code
                              ? <Check className="h-3.5 w-3.5 text-green-500" />
                              : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Staff panel */}
                    {isExpanded && (
                      <div className="mt-4 border-t border-border pt-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Staff & Roles
                        </h4>

                        {loadingProfs === inst.id ? (
                          <div className="flex justify-center py-4">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : profs.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No professors have joined this institution yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {profs.map((prof) => (
                              <div
                                key={prof.user_id}
                                className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                                  </div>
                                  <span className="text-sm font-medium text-foreground truncate">
                                    {prof.display_name || "Unknown"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <RoleBadge role={prof.institution_role} />
                                  <Select
                                    value={prof.institution_role}
                                    onValueChange={(v) =>
                                      handleRoleChange(inst.id, prof.user_id, v as InstitutionRole)
                                    }
                                    disabled={updatingRole === prof.user_id}
                                  >
                                    <SelectTrigger className="h-7 w-28 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="teacher">
                                        <span className="flex items-center gap-1.5">
                                          <GraduationCap className="h-3.5 w-3.5" /> Professor
                                        </span>
                                      </SelectItem>
                                      <SelectItem value="dept_admin">
                                        <span className="flex items-center gap-1.5">
                                          <ShieldCheck className="h-3.5 w-3.5" /> Dept. Chair
                                        </span>
                                      </SelectItem>
                                      <SelectItem value="institution_admin">
                                        <span className="flex items-center gap-1.5">
                                          <Crown className="h-3.5 w-3.5" /> President
                                        </span>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
