
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/auth';
import { User, UserRole } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseEditor from './pages/CourseEditor';
import LessonPage from './pages/LessonPage';
import Resources from './pages/Resources';
import AdminUsers from './pages/AdminUsers';
import AdminLogs from './pages/AdminLogs';
import AdminSettings from './pages/AdminSettings';
import CourseViewer from './pages/CourseViewer';
import PresentationMode from './pages/PresentationMode';
import Layout from './components/Layout';
import { NotificationProvider } from './contexts/NotificationContext';

// Auth Guard Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  user: User | null; 
  requiredRole?: UserRole 
}> = ({ children, user, requiredRole }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;
  return <Layout user={user}>{children}</Layout>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial Auth Check
  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };
    initAuth();

    // Listen for custom auth-change event triggered by Login/Logout
    const handleAuthChange = (e: Event) => {
       const customEvent = e as CustomEvent<User | null>;
       
       // Optimization: If the event carries the user object, use it immediately
       // to prevent race conditions during navigation
       if (customEvent.detail !== undefined) {
         setUser(customEvent.detail);
       } else {
         // Fallback for other contexts
         authService.getCurrentUser().then(setUser);
       }
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  // Poll for token changes in other tabs (fallback)
  useEffect(() => {
    const interval = setInterval(async () => {
      const storedToken = authService.getToken();
      if (!storedToken && user) {
        setUser(null); // Logged out
      } else if (storedToken && !user) {
        // Logged in externally
        const u = await authService.getCurrentUser();
        setUser(u);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-400">Подключение к серверу...</div>;

  return (
    <NotificationProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute user={user}>
              <Dashboard user={user!} />
            </ProtectedRoute>
          } />
          
          <Route path="/courses" element={
            <ProtectedRoute user={user}>
              <CourseList user={user!} />
            </ProtectedRoute>
          } />
          
          <Route path="/resources" element={
            <ProtectedRoute user={user}>
              <Resources />
            </ProtectedRoute>
          } />
          
          <Route path="/course/:id" element={
            <ProtectedRoute user={user}>
              <CourseEditor user={user!} />
            </ProtectedRoute>
          } />
          
          <Route path="/lesson/:id" element={
            <ProtectedRoute user={user}>
              <LessonPage user={user!} />
            </ProtectedRoute>
          } />

          {/* Viewer Routes */}
          <Route path="/view/course/:id" element={
             user ? <CourseViewer /> : <Navigate to="/login" />
          } />

          <Route path="/present/:lessonId" element={
             user ? <PresentationMode /> : <Navigate to="/login" />
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute user={user} requiredRole={UserRole.ADMIN}>
              <AdminUsers />
            </ProtectedRoute>
          } />

          <Route path="/admin/logs" element={
            <ProtectedRoute user={user} requiredRole={UserRole.ADMIN}>
              <AdminLogs />
            </ProtectedRoute>
          } />

          <Route path="/admin/settings" element={
            <ProtectedRoute user={user} requiredRole={UserRole.ADMIN}>
              <AdminSettings />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </NotificationProvider>
  );
};

export default App;
