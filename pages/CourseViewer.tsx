
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Course, Module, Lesson, ViewerSettings } from '../types';
import { server } from '../services/server';
import { authService } from '../services/auth';
import { BlockRenderer } from '../components/BlockRenderer';
import { 
  ChevronLeft, ChevronRight, Settings, Moon, Sun, Type, 
  MonitorPlay, Menu, X, BookOpen
} from 'lucide-react';

const CourseViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Course ID
  const navigate = useNavigate();
  
  // Data State
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  // View State
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Settings State
  const [settings, setSettings] = useState<ViewerSettings>({
    theme: 'light',
    fontSize: 'medium',
    showBlocks: true
  });

  // --- Init ---
  useEffect(() => {
    const loadCourse = async () => {
      const token = authService.getToken();
      if (!token || !id) return;

      try {
        const res = await server.courses.get(token, id);
        if (res.data) {
          setCourse(res.data.course);
          setModules(res.data.modules);
          setLessons(res.data.lessons);
          
          if (res.data.lessons.length > 0) {
            setActiveLesson(res.data.lessons[0]);
          }
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [id]);

  // --- Navigation Logic ---
  const handleNextLesson = () => {
    if (!activeLesson) return;
    const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex < lessons.length - 1) {
      setActiveLesson(lessons[currentIndex + 1]);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevLesson = () => {
    if (!activeLesson) return;
    const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex > 0) {
      setActiveLesson(lessons[currentIndex - 1]);
      window.scrollTo(0, 0);
    }
  };

  // --- Theme Classes ---
  const getContainerClass = () => {
    switch(settings.theme) {
      case 'dark': return 'bg-slate-900 text-slate-100';
      case 'sepia': return 'bg-amber-50 text-amber-900';
      default: return 'bg-white text-slate-900';
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Загрузка курса...</div>;
  if (!course) return <div>Курс не найден</div>;

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${getContainerClass()}`}>
      
      {/* --- Top Bar --- */}
      <div className={`h-16 flex items-center justify-between px-4 border-b shrink-0 z-20 relative ${settings.theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white/80 backdrop-blur'}`}>
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(`/course/${course.id}`)} className="p-2 rounded hover:bg-black/5" title="Назад в редактор">
              <ChevronLeft size={20} />
           </button>
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded hover:bg-black/5 md:hidden">
              <Menu size={20} />
           </button>
           <div>
             <h1 className="font-bold text-lg leading-tight">{course.title}</h1>
             <p className="text-xs opacity-60 hidden md:block">{activeLesson?.title}</p>
           </div>
        </div>

        <div className="flex items-center gap-2">
          {activeLesson && (
            <button 
              onClick={() => navigate(`/present/${activeLesson.id}`)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <MonitorPlay size={16} />
              <span>Презентация</span>
            </button>
          )}
          
          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className={`p-2 rounded transition-colors ${showSettings ? 'bg-black/10' : 'hover:bg-black/5'}`}
            >
              <Settings size={20} />
            </button>
            
            {/* Settings Dropdown */}
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 text-slate-800 p-4 z-50">
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Тема</label>
                  <div className="flex bg-slate-100 rounded-lg p-1">
                    <button onClick={() => setSettings({...settings, theme: 'light'})} className={`flex-1 flex justify-center py-1.5 rounded ${settings.theme === 'light' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Sun size={16} /></button>
                    <button onClick={() => setSettings({...settings, theme: 'sepia'})} className={`flex-1 flex justify-center py-1.5 rounded ${settings.theme === 'sepia' ? 'bg-amber-100 shadow text-amber-800' : 'text-slate-500'}`}><BookOpen size={16} /></button>
                    <button onClick={() => setSettings({...settings, theme: 'dark'})} className={`flex-1 flex justify-center py-1.5 rounded ${settings.theme === 'dark' ? 'bg-slate-800 shadow text-white' : 'text-slate-500'}`}><Moon size={16} /></button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Размер текста</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSettings({...settings, fontSize: 'small'})} className={`p-2 rounded border ${settings.fontSize === 'small' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500'}`}><Type size={14} /></button>
                    <button onClick={() => setSettings({...settings, fontSize: 'medium'})} className={`p-2 rounded border ${settings.fontSize === 'medium' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500'}`}><Type size={18} /></button>
                    <button onClick={() => setSettings({...settings, fontSize: 'large'})} className={`p-2 rounded border ${settings.fontSize === 'large' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500'}`}><Type size={22} /></button>
                    <button onClick={() => setSettings({...settings, fontSize: 'huge'})} className={`p-2 rounded border ${settings.fontSize === 'huge' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500'}`}><Type size={26} /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar Navigation */}
        <aside className={`
          absolute md:relative z-10 w-64 h-full border-r transition-all duration-300 transform 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:translate-x-0 md:border-none md:overflow-hidden'}
          ${settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}
        `}>
          <div className="h-full overflow-y-auto py-4">
             <div className="px-4 mb-4 flex justify-between items-center md:hidden">
                <span className="font-bold">Меню</span>
                <button onClick={() => setSidebarOpen(false)}><X size={20}/></button>
             </div>
             
             {modules.map(mod => (
               <div key={mod.id} className="mb-2">
                 <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${settings.theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                   {mod.title}
                 </div>
                 {lessons.filter(l => l.moduleId === mod.id).map(lesson => (
                   <button
                     key={lesson.id}
                     onClick={() => { setActiveLesson(lesson); setSidebarOpen(false); }}
                     className={`w-full text-left px-4 py-2 text-sm border-l-2 transition-colors
                       ${activeLesson?.id === lesson.id 
                         ? 'border-blue-500 font-medium ' + (settings.theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-blue-700')
                         : 'border-transparent opacity-70 hover:opacity-100 ' + (settings.theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100')
                       }
                     `}
                   >
                     {lesson.title}
                   </button>
                 ))}
               </div>
             ))}
          </div>
        </aside>

        {/* Content Render */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth p-4 md:p-12">
           <div className={`max-w-3xl mx-auto min-h-[80vh] ${settings.theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>
             
             {/* Lesson Header */}
             <div className="mb-8 pb-8 border-b border-dashed border-slate-300/30">
               <span className="text-sm font-bold opacity-50 uppercase tracking-wider">Урок</span>
               <h2 className="text-4xl font-bold mt-2 leading-tight">{activeLesson?.title}</h2>
             </div>

             {/* Blocks */}
             <div className="space-y-2">
                {activeLesson?.blocks.length === 0 && (
                  <div className="text-center py-20 opacity-50 italic">В этом уроке пока нет контента.</div>
                )}
                {activeLesson?.blocks.map(block => (
                   <BlockRenderer 
                      key={block.id} 
                      block={block} 
                      settings={settings} 
                   />
                ))}
             </div>

             {/* Footer Nav */}
             <div className="mt-20 pt-8 border-t border-slate-300/30 flex justify-between">
                <button 
                  onClick={handlePrevLesson}
                  disabled={!activeLesson || lessons.findIndex(l => l.id === activeLesson.id) === 0}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-300/30 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                  <div className="text-left">
                    <div className="text-xs opacity-60">Предыдущий</div>
                    <div className="font-medium">Урок</div>
                  </div>
                </button>

                <button 
                  onClick={handleNextLesson}
                  disabled={!activeLesson || lessons.findIndex(l => l.id === activeLesson.id) === lessons.length - 1}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-300/30 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="text-right">
                    <div className="text-xs opacity-60">Следующий</div>
                    <div className="font-medium">Урок</div>
                  </div>
                  <ChevronRight size={20} />
                </button>
             </div>

           </div>
        </main>

      </div>
    </div>
  );
};

export default CourseViewer;
