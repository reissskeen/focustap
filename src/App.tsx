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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
