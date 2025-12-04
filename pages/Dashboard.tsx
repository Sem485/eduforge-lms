
import React, { useEffect, useState } from 'react';
import { User, Course, LogEntry } from '../types';
import { server } from '../services/server';
import { authService } from '../services/auth';
import { BookOpen, Clock, Activity, Plus, ArrowRight, FileText, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({ courses: 0, actions: 0 });
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = authService.getToken();
      if (!token) return;

      try {
        const [coursesRes, logsRes] = await Promise.all([
          server.courses.list(token),
          user.role === 'ADMIN' ? server.admin.getLogs(token) : Promise.resolve({ data: [] })
        ]);

        const courses = coursesRes.data || [];
        setStats({
          courses: courses.length,
          actions: logsRes.data?.length || 0
        });

        // Get top 3 recent courses
        setRecentCourses(courses.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3));
        
        // Logs
        if (logsRes.data) {
          setRecentLogs(logsRes.data.slice(0, 5));
        }

      } catch (err) {
        console.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return (
    <div className="flex flex-col gap-4 animate-pulse">
       <div className="h-32 bg-slate-200 rounded-xl"></div>
       <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-slate-200 rounded-xl"></div>
          <div className="h-24 bg-slate-200 rounded-xl"></div>
          <div className="h-24 bg-slate-200 rounded-xl"></div>
       </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">С возвращением, {user.fullName.split(' ')[0]}</h1>
          <p className="text-blue-100 max-w-xl">
            У вас <span className="font-bold text-white">{stats.courses} активных курсов</span> в библиотеке. 
            {user.role === 'ADMIN' && ' Статус системы в норме.'}
          </p>
          <div className="mt-6 flex gap-3">
             <Link to="/courses" className="bg-white text-blue-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
               Управление курсами
             </Link>
             <Link to="/resources" className="bg-blue-800 text-blue-100 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-900 transition-colors border border-blue-700">
               Загрузить ресурс
             </Link>
          </div>
        </div>
        {/* Decorative Circles */}
        <div className="absolute right-0 top-0 h-64 w-64 bg-white/10 rounded-full transform translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
        <div className="absolute right-20 bottom-0 h-32 w-32 bg-blue-500/20 rounded-full blur-xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Курсы</p>
              <p className="text-3xl font-bold text-slate-900">{stats.courses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Статус</p>
              <p className="text-3xl font-bold text-slate-900">Активен</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">События</p>
              <p className="text-3xl font-bold text-slate-900">{stats.actions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Courses */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-bold text-slate-900">Недавно обновленные</h2>
            <Link to="/courses" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Все курсы <ArrowRight size={14} />
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {recentCourses.length > 0 ? recentCourses.map(course => (
              <div key={course.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  <BookOpen size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">{course.title}</h3>
                  <p className="text-xs text-slate-500">Обновлено {new Date(course.updatedAt).toLocaleDateString('ru-RU')}</p>
                </div>
                <Link to={`/course/${course.id}`} className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-blue-600 hover:text-white rounded text-slate-600 transition-all">
                  Ред.
                </Link>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-400">
                <p>Курсов пока нет.</p>
                <Link to="/courses" className="text-blue-600 font-bold text-sm mt-2 inline-block">Создать</Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity (Admin) or Shortcuts (Instructor) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
             <h2 className="text-lg font-bold text-slate-900">{user.role === 'ADMIN' ? 'Системные логи' : 'Быстрый старт'}</h2>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
            {user.role === 'ADMIN' ? (
               <div className="divide-y divide-slate-100">
                 {recentLogs.map(log => (
                   <div key={log.id} className="p-4 flex items-start gap-3 text-sm">
                      <Clock size={16} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800">{log.action}</p>
                        <p className="text-slate-500 text-xs">{log.details} от <span className="text-slate-700">{log.username}</span></p>
                      </div>
                   </div>
                 ))}
                 {recentLogs.length === 0 && <div className="p-4 text-slate-400 text-sm">Нет недавней активности.</div>}
               </div>
            ) : (
               <div className="p-6 space-y-4">
                  <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                     <div>
                       <h4 className="font-bold text-slate-800">Создайте курс</h4>
                       <p className="text-sm text-slate-500 mt-1">Начните с названия и описания курса во вкладке "Курсы".</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">2</div>
                     <div>
                       <h4 className="font-bold text-slate-800">Добавьте модули и уроки</h4>
                       <p className="text-sm text-slate-500 mt-1">Структурируйте контент с помощью визуального редактора.</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">3</div>
                     <div>
                       <h4 className="font-bold text-slate-800">Публикация и Экспорт</h4>
                       <p className="text-sm text-slate-500 mt-1">Экспортируйте курс в PDF, HTML или ZIP для студентов.</p>
                     </div>
                  </div>
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
