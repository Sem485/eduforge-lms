
import React, { useState, useEffect } from 'react';
import { Course, User } from '../types';
import { server } from '../services/server';
import { authService } from '../services/auth';
import { Plus, Search, Trash, Download, BookOpen, MoreVertical, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { exportCourse } from '../services/export';
import { useNotification } from '../contexts/NotificationContext';

interface CourseListProps {
  user: User;
}

const CourseList: React.FC<CourseListProps> = ({ user }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => {
    refreshCourses();
  }, []);

  const refreshCourses = async () => {
    setLoading(true);
    const token = authService.getToken();
    if (!token) return;
    
    const res = await server.courses.list(token);
    if (res.data) {
      setCourses(res.data);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    const token = authService.getToken();
    if (!token) return;

    try {
      const res = await server.courses.create(token, {
        title: 'Новый курс без названия',
        description: 'Описание отсутствует.'
      });

      if (res.data) {
        addNotification('success', 'Курс успешно создан');
        navigate(`/course/${res.data.id}`);
      }
    } catch (e) {
      addNotification('error', 'Не удалось создать курс');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Вы уверены, что хотите удалить этот курс? Это действие нельзя отменить.')) return;
    
    const token = authService.getToken();
    if (!token) return;

    await server.courses.delete(token, id);
    addNotification('info', 'Курс удален');
    refreshCourses();
  };

  const handleExport = (id: string, format: 'json' | 'html' | 'zip', e: React.MouseEvent) => {
    e.preventDefault();
    addNotification('info', `Запуск экспорта в ${format.toUpperCase()}...`);
    exportCourse(id, format, user)
      .then(() => addNotification('success', 'Экспорт завершен'))
      .catch(() => addNotification('error', 'Ошибка экспорта'));
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Библиотека курсов</h1>
          <p className="text-slate-500">Управляйте учебной программой и материалами.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all font-bold shadow-lg shadow-blue-500/20 hover:-translate-y-0.5"
        >
          <Plus size={18} />
          <span>Создать новый курс</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Поиск по названию..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-shadow placeholder-slate-400 text-slate-900"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
           {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>)}
        </div>
      ) : (
        <>
          {filteredCourses.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <BookOpen size={32} />
               </div>
               <h3 className="text-lg font-bold text-slate-700">Курсы не найдены</h3>
               <p className="text-slate-500 mb-6">Попробуйте изменить поиск или создайте новый курс.</p>
               <button onClick={handleCreate} className="text-blue-600 font-bold hover:underline">Создать курс</button>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <div key={course.id} className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col">
                  {/* Card Header (Thumbnail placeholder) */}
                  <Link to={`/course/${course.id}`} className="h-32 bg-slate-50 border-b border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors relative overflow-hidden">
                    <BookOpen size={48} className="relative z-10" />
                    {/* Decorative Blob */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-current opacity-10 rounded-full blur-2xl"></div>
                  </Link>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <Link to={`/course/${course.id}`} className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {course.title}
                      </Link>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shrink-0 ml-2 ${course.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {course.isPublished ? 'Опубликован' : 'Черновик'}
                      </span>
                    </div>
                    
                    <p className="text-slate-500 text-sm mb-6 line-clamp-2 min-h-[40px]">
                      {course.description || "Описание не добавлено."}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium">
                        Изм. {new Date(course.updatedAt).toLocaleDateString('ru-RU')}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <Link 
                          to={`/course/${course.id}`}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                          title="Редактировать"
                        >
                          <Edit size={16} />
                        </Link>
                        <button 
                          onClick={(e) => handleExport(course.id, 'html', e)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-green-600 transition-colors"
                          title="Экспорт"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(course.id, e)}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                          title="Удалить"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CourseList;
