import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Common layouts
import Sidebar from './components/common/Sidebar.jsx';

// Public Pages
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageStudents from './pages/admin/ManageStudents.jsx';
import ManageFaculty from './pages/admin/ManageFaculty.jsx';
import ManageAcademics from './pages/admin/ManageAcademics.jsx';
import SubjectAllocations from './pages/admin/SubjectAllocations.jsx';
import ImportData from './pages/admin/ImportData.jsx';
import AuditLogs from './pages/admin/AuditLogs.jsx';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard.jsx';
import EnterMarks from './pages/faculty/EnterMarks.jsx';
import AttendanceManager from './pages/faculty/AttendanceManager.jsx';
import CourseAnalytics from './pages/faculty/CourseAnalytics.jsx';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import ViewResults from './pages/student/ViewResults.jsx';
import AIChatbot from './components/ai/AIChatbot.jsx';

// Protected Route Enforcer
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-cyber-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized roles back to their default dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
    if (user.role === 'student') return <Navigate to="/student" replace />;
  }

  return <Outlet />;
};

// Main Layout Wrapper
const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-cyber-bg cyber-grid-bg relative">
      {/* Decorative neon background blurs */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-cyber-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-cyber-secondary/5 blur-[120px] pointer-events-none"></div>

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Pane */}
      <main className="flex-1 lg:pl-64 min-w-0 transition-all duration-300">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Secure Portal Layout routes */}
          <Route element={<DashboardLayout />}>
            
            {/* Admin Modules */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<ManageStudents />} />
              <Route path="/admin/faculty" element={<ManageFaculty />} />
              <Route path="/admin/academics" element={<ManageAcademics />} />
              <Route path="/admin/assignments" element={<SubjectAllocations />} />
              <Route path="/admin/imports" element={<ImportData />} />
              <Route path="/admin/audit" element={<AuditLogs />} />
            </Route>

            {/* Faculty Modules */}
            <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
              <Route path="/faculty" element={<FacultyDashboard />} />
              <Route path="/faculty/marks" element={<EnterMarks />} />
              <Route path="/faculty/attendance" element={<AttendanceManager />} />
              <Route path="/faculty/analytics" element={<CourseAnalytics />} />
            </Route>

            {/* Student Modules */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/results" element={<ViewResults />} />
              <Route path="/student/chatbot" element={<AIChatbot />} />
            </Route>

          </Route>

          {/* Root wildcard fallback routing */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
