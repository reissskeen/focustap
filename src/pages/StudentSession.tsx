import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Send, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import FocusTimer from "@/components/FocusTimer";
import NotesEditor from "@/components/NotesEditor";

const StudentSession = () => {
  const { sessionId } = useParams();
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notesContent, setNotesContent] = useState<object | null>(null);

  const sessionInfo = {
    course: "AP Computer Science",
    teacher: "Ms. Rodriguez",
    date: "Feb 10, 2026",
    session: sessionId || "demo",
  };

  const handleSubmit = () => {
    setSubmitted(true);
    toast.success("Notes submitted successfully!");
  };

  const handleCopy = () => {
    setCopied(true);
    toast.success("Notes copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Session Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-1">
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl font-bold">{sessionInfo.course}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {sessionInfo.teacher} · {sessionInfo.date} · Session {sessionInfo.session}
            </p>
          </motion.div>

          {/* Main Layout */}
          <div className="grid lg:grid-cols-[1fr_300px] gap-6">
            {/* Notes Editor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="min-h-[500px]"
            >
              <NotesEditor
                onContentChange={setNotesContent}
                readOnly={submitted}
              />
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <FocusTimer sessionActive={!submitted} />

              <div className="glass-card rounded-xl p-5 space-y-3">
                <Button
                  onClick={handleSubmit}
                  disabled={submitted}
                  className="w-full gap-2"
                >
                  {submitted ? (
                    <><Check className="w-4 h-4" /> Submitted</>
                  ) : (
                    <><Send className="w-4 h-4" /> Submit Notes</>
                  )}
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleCopy}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                    <Download className="w-3.5 h-3.5" /> PDF
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSession;
