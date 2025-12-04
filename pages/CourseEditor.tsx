
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Course, Module, Lesson, User } from '../types';
import { server } from '../services/server';
import { authService } from '../services/auth';
import { ChevronRight, Download, BookOpen, Layers, Edit3, MonitorPlay } from 'lucide-react';
import { exportCourse } from '../services/export';

interface CourseEditorProps {
  user: User;
}

const CourseEditor: React.FC<CourseEditorProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [stats, setStats] = useState({ modules: 0, lessons: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (courseId: string) => {
    const token = authService.getToken();
    if (!token) return;

    try {
      const res = await server.courses.get(token, courseId);
      if (res.data) {
        setCourse(res.data.course);
        setStats({
          modules: res.data.modules.length,
          lessons: res.data.lessons.length
        });
      } else {
        navigate('/courses');
      }
    } catch (e) {
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (updates: Partial<Course>) => {
    if (!course) return;
    const token = authService.getToken();
    if (!token) return;

    setCourse({ ...course, ...updates });
    await server.courses.update(token, course.id, updates);
  };

  const enterWorkspace = async () => {
    if(!course) return;
    const token = authService.getToken();
    if(!token) return;
    
    // Find first lesson or create one
    const res = await server.courses.get(token, course.id);
    if(res.data) {
       if(res.data.lessons.length > 0) {
         navigate(`/lesson/${res.data.lessons[0].id}`);
       } else {
         // Create default structure
         const mod = await server.modules.create(token, course.id);
         if(mod.data) {
           const les = await server.lessons.create(token, mod.data.id);
           if(les.data) navigate(`/lesson/${les.data.id}`);
         }
       }
    }
  };

  if (loading) return <div>Загрузка данных курса...</div>;
  if (!course) return <div>Курс не найден</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row gap-8 items-start">
        <div className="w-32 h-32 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
          <BookOpen size={48} />
        </div>
        
        <div className="flex-1 w-full space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Название курса</label>
            <input
              type="text"
              value={course.title}
              onChange={(e) => handleUpdateCourse({ title: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-3xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-300"
              placeholder="Введите название курса"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Описание</label>
            <textarea 
              value={course.description} 
              onChange={(e) => handleUpdateCourse({ description: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="О чем этот курс?"
              rows={2}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4">
             <button 
               onClick={enterWorkspace}
               className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/30 hover:-translate-y-0.5"
             >
               <Edit3 size={20} />
               <span>Открыть редактор</span>
             </button>

             <button 
               onClick={() => navigate(`/view/course/${course.id}`)}
               className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-5 py-3 rounded-xl hover:bg-slate-50 transition-all font-bold"
             >
               <MonitorPlay size={20} />
               <span>Просмотр</span>
             </button>
             
             <button 
                onClick={() => handleUpdateCourse({ isPublished: !course.isPublished })}
                className={`px-4 py-3 rounded-xl font-medium transition-colors ${course.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}
             >
                {course.isPublished ? 'Статус: Опубликован' : 'Статус: Черновик'}
             </button>
          </div>
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
               <Layers size={20} />
               <span className="font-semibold">Статистика</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">
               {stats.modules} <span className="text-sm font-normal text-slate-400">Модулей</span>
               <span className="mx-2 text-slate-300">/</span>
               {stats.lessons} <span className="text-sm font-normal text-slate-400">Уроков</span>
            </div>
         </div>

         <div className="bg-white p-6 rounded-xl border border-slate-200 md:col-span-2">
            <div className="flex items-center gap-3 text-slate-500 mb-4">
               <Download size={20} />
               <span className="font-semibold">Опции экспорта</span>
            </div>
            <div className="flex flex-wrap gap-2">
               <button onClick={() => exportCourse(course.id, 'html', user)} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">HTML Сайт</button>
               <button onClick={() => exportCourse(course.id, 'pdf', user)} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">PDF Документ</button>
               <button onClick={() => exportCourse(course.id, 'pptx', user)} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">PowerPoint</button>
               <button onClick={() => exportCourse(course.id, 'zip', user)} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">ZIP Архив</button>
            </div>
         </div>
      </div>

    </div>
  );
};

export default CourseEditor;
