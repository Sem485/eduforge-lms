
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lesson, User, Module, Course } from '../types';
import { server } from '../services/server';
import { authService } from '../services/auth';
import VisualEditor from '../components/VisualEditor';
import CourseOutline from '../components/CourseOutline';
import { BlockRenderer } from '../components/BlockRenderer';
import { ChevronLeft, Save, Eye, Layout as LayoutIcon, Loader2 } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

interface LessonPageProps {
  user: User;
}

const LessonPage: React.FC<LessonPageProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  // State
  const [activeLessonId, setActiveLessonId] = useState<string | null>(id || null);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  // Load Initial Data
  useEffect(() => {
    const init = async () => {
      if (!id) return;
      setLoading(true);
      const token = authService.getToken();
      if (!token) return;

      try {
        const lessonRes = await server.lessons.get(token, id);
        if (!lessonRes.data) { navigate('/courses'); return; }
        
        // Load context (course, modules) by scanning for the lesson
        const allCourses = (await server.courses.list(token)).data || [];
        let foundCourse: Course | undefined;
        
        // Find course containing this lesson
        for (const c of allCourses) {
           const cRes = await server.courses.get(token, c.id);
           if (cRes.data && cRes.data.lessons.some(lx => lx.id === id)) {
              setCourse(cRes.data.course);
              setModules(cRes.data.modules);
              setLessons(cRes.data.lessons);
              foundCourse = cRes.data.course;
              break;
           }
        }

        if (foundCourse) {
           const l = lessonRes.data;
           setActiveLesson(l);
           setActiveLessonId(l.id);
        }

      } catch (err) {
        console.error(err);
        addNotification('error', 'Ошибка загрузки урока');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  // Handle Lesson Switching
  useEffect(() => {
    if (activeLessonId && lessons.length > 0) {
      const l = lessons.find(lx => lx.id === activeLessonId);
      if (l) {
        setActiveLesson(l);
        // Do not full reload if just switching content, but need URL update
        if (id !== activeLessonId) {
           navigate(`/lesson/${l.id}`, { replace: true });
        }
      }
    }
  }, [activeLessonId, lessons]);

  const handleSave = async () => {
    if (!activeLesson) return;
    setSaving(true);
    const token = authService.getToken();
    if (token) {
      try {
        await server.lessons.update(token, activeLesson.id, {
          title: activeLesson.title,
          blocks: activeLesson.blocks
        });
        setLessons(prev => prev.map(l => l.id === activeLesson.id ? activeLesson : l));
        addNotification('success', 'Урок сохранен');
      } catch (e) {
        addNotification('error', 'Ошибка сохранения');
      }
    }
    setSaving(false);
  };

  const handleResourceUpload = async (file: File): Promise<string> => {
    const token = authService.getToken();
    if (!token) throw new Error("No auth");
    const res = await server.resources.upload(token, file);
    if (res.data) {
       addNotification('success', 'Файл загружен');
       return res.data.url;
    }
    throw new Error(res.error);
  };

  // Course Structure Helpers
  const handleCreateModule = async () => {
    if (!course) return;
    const token = authService.getToken();
    if(token) {
      const res = await server.modules.create(token, course.id);
      if(res.data) {
        setModules([...modules, res.data]);
        addNotification('success', 'Модуль добавлен');
      }
    }
  };

  const handleCreateLesson = async (moduleId: string) => {
    const token = authService.getToken();
    if(token) {
      const res = await server.lessons.create(token, moduleId);
      if(res.data) {
        setLessons([...lessons, res.data]);
        setActiveLessonId(res.data.id);
        addNotification('success', 'Урок создан');
      }
    }
  };

  const handleDeleteLesson = async (lid: string) => {
    if(!confirm("Удалить этот урок?")) return;
    setLessons(prev => prev.filter(l => l.id !== lid));
    if(activeLessonId === lid) setActiveLessonId(null);
    addNotification('info', 'Урок удален');
  };

  if (loading) return <div className="h-full flex items-center justify-center text-slate-400"><Loader2 className="animate-spin mr-2"/> Загрузка рабочей области...</div>;
  if (!activeLesson || !course) return <div className="p-8 text-center">Урок не найден или данные курса отсутствуют.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-4 md:-m-8 bg-white overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0 z-10 shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(`/course/${course.id}`)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title="Назад к настройкам курса">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
             <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{course.title}</span>
             <input 
               value={activeLesson.title}
               onChange={(e) => setActiveLesson({...activeLesson, title: e.target.value})}
               className="font-bold text-slate-800 border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 p-1 -ml-1 h-8 text-lg w-64 md:w-96 bg-transparent rounded transition-all placeholder-slate-300 focus:bg-white"
               placeholder="Название урока"
             />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
             onClick={() => setPreviewMode(!previewMode)} 
             className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${previewMode ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`} 
             title="Переключить предпросмотр"
          >
            <Eye size={18} />
            <span className="hidden md:inline">Просмотр</span>
          </button>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm font-bold shadow-md shadow-blue-500/20 active:scale-95"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? 'Сохранение...' : 'Сохранить'}</span>
          </button>
        </div>
      </div>

      {/* Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <CourseOutline 
          modules={modules}
          lessons={lessons}
          activeLessonId={activeLessonId}
          onSelectLesson={setActiveLessonId}
          onAddModule={handleCreateModule}
          onAddLesson={handleCreateLesson}
          onDeleteLesson={handleDeleteLesson}
          onDeleteModule={() => {}} 
        />

        {/* Editor Canvas */}
        <div className="flex-1 relative bg-slate-100">
           {previewMode ? (
             <div className="absolute inset-0 bg-white overflow-y-auto p-8 md:p-12">
                <div className="max-w-3xl mx-auto">
                   <h1 className="text-4xl font-bold mb-8 pb-4 border-b">{activeLesson.title}</h1>
                   {/* Shared Renderer for WYSIWYG accuracy */}
                   {activeLesson.blocks.map(b => (
                     <BlockRenderer 
                       key={b.id} 
                       block={b} 
                       settings={{ theme: 'light', fontSize: 'medium', showBlocks: false }} 
                     />
                   ))}
                </div>
             </div>
           ) : (
             <VisualEditor 
                blocks={activeLesson.blocks}
                onChange={(newBlocks) => setActiveLesson({...activeLesson, blocks: newBlocks})}
                onUploadResource={handleResourceUpload}
             />
           )}
        </div>
      </div>
    </div>
  );
};

export default LessonPage;
