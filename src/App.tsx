import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import Index from "./pages/Index";
import StudentSession from "./pages/StudentSession";
import StudentDashboard from "./pages/StudentDashboard";
import CourseWorkspace from "./pages/CourseWorkspace";
import TeacherDashboard from "./pages/TeacherDashboard";
import Launch from "./pages/Launch";
import Login from "./pages/Login";
import TeacherLogin from "./pages/TeacherLogin";
import JoinClass from "./pages/JoinClass";
import NotFound from "./pages/NotFound";
import Financials from "./pages/Financials";
import PitchDeck from "./pages/PitchDeck";
import AdminHub from "./pages/AdminHub";
import Institutions from "./pages/Institutions";
import PinProtectedRoute from "./components/PinProtectedRoute";
import ConsentGuard from "./components/ConsentGuard";
import DemoJoin from "./pages/DemoJoin";
import PosterBoard from "./pages/PosterBoard";
import SessionReport from "./pages/SessionReport";
import ProfessorAnalytics from "./pages/ProfessorAnalytics";
import Consent from "./pages/Consent";

const queryClient = new QueryClient();

const App = () => (
  <Sentry.ErrorBoundary fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Something went wrong. Please refresh the page.</p></div>}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ConsentGuard>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/student" element={
                <RoleProtectedRoute allowedRoles={["student"]} redirectTo="/login"><StudentDashboard /></RoleProtectedRoute>
              } />
              <Route path="/session/:sessionId" element={
                <RoleProtectedRoute allowedRoles={["student"]} redirectTo="/login"><StudentSession /></RoleProtectedRoute>
              } />
              <Route path="/course/:courseId" element={
                <RoleProtectedRoute allowedRoles={["student"]} redirectTo="/login"><CourseWorkspace /></RoleProtectedRoute>
              } />
              <Route path="/teacher" element={
                <RoleProtectedRoute allowedRoles={["teacher", "admin"]} redirectTo="/teacher-login"><TeacherDashboard /></RoleProtectedRoute>
              } />
              <Route path="/launch" element={
                <RoleProtectedRoute allowedRoles={["teacher", "admin"]} redirectTo="/teacher-login"><Launch /></RoleProtectedRoute>
              } />
              <Route path="/join" element={
                <RoleProtectedRoute allowedRoles={["student"]} redirectTo="/login"><JoinClass /></RoleProtectedRoute>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/teacher-login" element={<TeacherLogin />} />
              <Route path="/admin" element={<PinProtectedRoute><AdminHub /></PinProtectedRoute>} />
              <Route path="/financials" element={<PinProtectedRoute><Financials /></PinProtectedRoute>} />
              <Route path="/pitch-deck" element={<PinProtectedRoute><PitchDeck /></PinProtectedRoute>} />
              <Route path="/institutions" element={
                <RoleProtectedRoute allowedRoles={["admin"]} redirectTo="/"><Institutions /></RoleProtectedRoute>
              } />
              <Route path="/demo" element={<DemoJoin />} />
              <Route path="/poster" element={<PosterBoard />} />
              <Route path="/analytics" element={
                <RoleProtectedRoute allowedRoles={["teacher", "admin"]} redirectTo="/teacher-login"><ProfessorAnalytics /></RoleProtectedRoute>
              } />
              <Route path="/teacher/session/:sessionId/report" element={
                <RoleProtectedRoute allowedRoles={["teacher", "admin"]} redirectTo="/teacher-login"><SessionReport /></RoleProtectedRoute>
              } />
              <Route path="/consent" element={<Consent />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </ConsentGuard>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Sentry.ErrorBoundary>
);

export default App;
