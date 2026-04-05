import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Toaster from './components/common/Toaster';
import LoadingSpinner from './components/common/LoadingSpinner';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import MembersPage from './pages/MembersPage';
import AttendancePage from './pages/AttendancePage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import VisitorsPage from './pages/VisitorsPage';
import UsersPage from './pages/UsersPage';
import BranchesPage from './pages/BranchesPage';
import AuditLogsPage from './pages/AuditLogsPage';

const ProtectedRoute = ({ children, adminOnly }) => {
  const auth = useAuth();
  if (!auth) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }
  
  const { user, loading } = auth;
  if (loading) return <LoadingSpinner fullScreen text="Loading..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'super-admin') return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="visitors" element={<VisitorsPage />} />
            <Route path="branches" element={<ProtectedRoute adminOnly><BranchesPage /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
            <Route path="audit-logs" element={<ProtectedRoute adminOnly><AuditLogsPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
