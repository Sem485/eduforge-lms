
import React, { useState } from 'react';
import { Module, Lesson } from '../types';
import { ChevronDown, ChevronRight, FileText, Plus, MoreVertical, GripVertical, Trash2 } from 'lucide-react';

interface CourseOutlineProps {
  modules: Module[];
  lessons: Lesson[];
  activeLessonId: string | null;
  onSelectLesson: (id: string) => void;
  onAddModule: () => void;
  onAddLesson: (moduleId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onDeleteModule: (moduleId: string) => void;
}

const CourseOutline: React.FC<CourseOutlineProps> = ({
  modules,
  lessons,
  activeLessonId,
  onSelectLesson,
  onAddModule,
  onAddLesson,
  onDeleteLesson,
  onDeleteModule
}) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleModule = (modId: string) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  return (
    <div className="bg-slate-50 w-64 border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-white">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Структура курса</h2>
        <button 
          onClick={onAddModule}
          className="w-full flex items-center justify-center space-x-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
        >
          <Plus size={14} />
          <span>Добавить модуль</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {modules.length === 0 && (
          <div className="text-center p-4 text-xs text-slate-400">
            Нет модулей. Добавьте первый.
          </div>
        )}

        {modules.map(module => {
           const moduleLessons = lessons.filter(l => l.moduleId === module.id).sort((a,b) => a.order - b.order);
           const isExpanded = expandedModules[module.id] !== false; // Default open

           return (
             <div key={module.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Module Header */}
                <div className="flex items-center justify-between p-2 bg-slate-100 border-b border-slate-100 group">
                  <div className="flex items-center space-x-1 cursor-pointer flex-1" onClick={() => toggleModule(module.id)}>
                    {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                    <span className="text-sm font-bold text-slate-700 truncate">{module.title}</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center">
                    <button onClick={() => onAddLesson(module.id)} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="Добавить урок">
                      <Plus size={14} />
                    </button>
                    <button onClick={() => onDeleteModule(module.id)} className="p-1 hover:bg-red-100 hover:text-red-500 rounded text-slate-500" title="Удалить модуль">
                       <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Lessons List */}
                {isExpanded && (
                  <div className="p-1 space-y-0.5">
                    {moduleLessons.map(lesson => (
                      <div 
                        key={lesson.id}
                        onClick={() => onSelectLesson(lesson.id)}
                        className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${activeLessonId === lesson.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <FileText size={14} className={activeLessonId === lesson.id ? 'text-blue-500' : 'text-slate-400'} />
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteLesson(lesson.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                          title="Удалить урок"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {moduleLessons.length === 0 && (
                      <div className="px-3 py-2 text-xs text-slate-400 italic">Нет уроков</div>
                    )}
                  </div>
                )}
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default CourseOutline;
