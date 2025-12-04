
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { authService } from '../services/auth';
import { 
  LogOut, BookOpen, LayoutDashboard, Users, Settings, 
  FileText, Shield, FolderOpen, Menu, Bell, Plus, Search,
  ChevronRight, X, UserPlus, FileUp
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
}

const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { addNotification } = useNotification();

  const handleLogout = () => {
    authService.logout();
    addNotification('info', 'Вы вышли из системы');
    navigate('/login');
  };

  const isActive = (path: string) => {
     if (path === '/') return location.pathname === '/';
     return location.pathname.startsWith(path);
  };

  // Breadcrumbs Generator
  const getBreadcrumbs = () => {
    const path = location.pathname.split('/').filter(Boolean);
    const crumbs = [{ name: 'Главная', path: '/' }];
    
    let currentPath = '';
    path.forEach((segment, index) => {
      currentPath += `/${segment}`;
      let name = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Basic mappings
      if (segment === 'admin') return; 
      if (segment === 'courses') name = 'Курсы';
      if (segment === 'resources') name = 'Ресурсы';
      if (segment === 'users') name = 'Пользователи';
      if (segment === 'logs') name = 'Логи';
      if (segment === 'settings') name = 'Настройки';
      if (path[index-1] === 'course' && segment.length > 10) name = 'Редактор';
      if (path[index-1] === 'lesson' && segment.length > 10) name = 'Урок';
      
      crumbs.push({ name, path: currentPath });
    });
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white mr-3">E</div>
          <span className="text-xl font-bold text-white tracking-tight">EduForge</span>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto text-slate-400">
             <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <Link 
            to="/" 
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${isActive('/') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Дашборд</span>
          </Link>

          <div className="pt-6 pb-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Контент</div>
          
          <Link 
            to="/courses" 
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${isActive('/courses') || isActive('/course') || isActive('/lesson') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <BookOpen size={20} />
            <span className="font-medium">Курсы</span>
          </Link>
          
          <Link 
            to="/resources" 
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${isActive('/resources') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <FolderOpen size={20} />
            <span className="font-medium">Ресурсы</span>
          </Link>

          {user.role === UserRole.ADMIN && (
            <>
              <div className="pt-6 pb-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Система</div>
              <Link 
                to="/admin/users" 
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${isActive('/admin/users') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <Users size={20} />
                <span className="font-medium">Пользователи</span>
              </Link>
              <Link 
                to="/admin/logs" 
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${isActive('/admin/logs') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <FileText size={20} />
                <span className="font-medium">Логи</span>
              </Link>
              <Link 
                to="/admin/settings" 
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${isActive('/admin/settings') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <Settings size={20} />
                <span className="font-medium">Настройки</span>
              </Link>
            </>
          )}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3 mb-3">
             <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400">
               {user.username.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1 overflow-hidden">
                <div className="text-sm font-medium text-white truncate">{user.fullName}</div>
                <div className="text-xs text-slate-500 flex items-center">
                   {user.role === UserRole.ADMIN && <Shield size={10} className="mr-1 text-amber-500" />}
                   {user.role}
                </div>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white py-2 rounded-lg transition-colors text-xs font-medium border border-slate-800"
          >
            <LogOut size={14} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-20 shrink-0">
           <div className="flex items-center flex-1">
             <button onClick={() => setSidebarOpen(true)} className="md:hidden mr-4 text-slate-500 hover:text-slate-800">
               <Menu size={24} />
             </button>
             
             {/* Breadcrumbs */}
             <nav className="hidden md:flex items-center text-sm text-slate-500">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <ChevronRight size={14} className="mx-2 text-slate-300" />}
                    <Link 
                      to={crumb.path} 
                      className={`hover:text-blue-600 transition-colors ${index === breadcrumbs.length - 1 ? 'font-semibold text-slate-900 pointer-events-none' : ''}`}
                    >
                      {crumb.name}
                    </Link>
                  </React.Fragment>
                ))}
             </nav>
           </div>

           {/* Header Actions */}
           <div className="flex items-center space-x-2 md:space-x-4">
              {/* Quick Actions Dropdown (Simulated as row for now) */}
              <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                 <Link to="/courses" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-md transition-all" title="Все курсы">
                   <BookOpen size={18} />
                 </Link>
                 <div className="w-px h-4 bg-slate-200 mx-1"></div>
                 <button onClick={() => navigate('/courses')} className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-white rounded-md transition-all">
                    <Plus size={14} />
                    <span>Создать курс</span>
                 </button>
                 {user.role === UserRole.ADMIN && (
                   <button onClick={() => navigate('/admin/users')} className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-md transition-all">
                      <UserPlus size={14} />
                      <span>Новый юзер</span>
                   </button>
                 )}
              </div>
              
              <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
              
              <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
           </div>
        </header>

        {/* Page Content Scroll Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 scroll-smooth">
           {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
