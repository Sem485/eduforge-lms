
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lesson, ViewerSettings } from '../types';
import { server } from '../services/server';
import { authService } from '../services/auth';
import { BlockRenderer } from '../components/BlockRenderer';
import { X, ArrowRight, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

const PresentationMode: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Presentation Settings (Locked for high visibility)
  const settings: ViewerSettings = {
    theme: 'dark',
    fontSize: 'huge',
    showBlocks: true
  };

  useEffect(() => {
    const fetchLesson = async () => {
      const token = authService.getToken();
      if (!token || !lessonId) return;
      const res = await server.lessons.get(token, lessonId);
      if (res.data) setLesson(res.data);
    };
    fetchLesson();
  }, [lessonId]);

  // Keyboard Navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!lesson) return;
    if (e.key === 'ArrowRight' || e.key === 'Space') {
      if (activeBlockIndex < lesson.blocks.length - 1) {
        setActiveBlockIndex(prev => prev + 1);
      }
    } else if (e.key === 'ArrowLeft') {
      if (activeBlockIndex > 0) {
        setActiveBlockIndex(prev => prev - 1);
      }
    } else if (e.key === 'Escape') {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        // Go back to course viewer if not fullscreen
        // We need courseId logic here, but for now we might just go back history
        navigate(-1);
      }
    }
  }, [lesson, activeBlockIndex, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (!lesson) return <div className="bg-black h-screen text-white flex items-center justify-center">Loading presentation...</div>;

  const currentBlock = lesson.blocks[activeBlockIndex];
  const progress = ((activeBlockIndex + 1) / lesson.blocks.length) * 100;

  return (
    <div className="bg-black min-h-screen text-white flex flex-col relative overflow-hidden">
      
      {/* Top Controls (Fade out on idle could be added) */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 opacity-0 hover:opacity-100 transition-opacity">
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{lesson.title}</div>
        <div className="flex gap-4">
          <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition-colors">
            {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
          </button>
          <button onClick={() => navigate(-1)} className="text-white hover:text-red-400 transition-colors">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Slide Area */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-24 relative">
        {/* Previous Ghost Block (Visual Context) */}
        {activeBlockIndex > 0 && (
           <div className="absolute top-0 opacity-10 blur-sm scale-90 pointer-events-none transition-all duration-500 transform -translate-y-1/2">
               <div className="max-w-4xl mx-auto line-clamp-2">
                 {lesson.blocks[activeBlockIndex - 1].content}
               </div>
           </div>
        )}

        {/* Active Block */}
        <div className="w-full max-w-5xl mx-auto transition-all duration-500 animate-in fade-in zoom-in-95 slide-in-from-bottom-4">
          {lesson.blocks.length > 0 ? (
             <BlockRenderer block={currentBlock} settings={settings} className="text-center" />
          ) : (
             <div className="text-center text-slate-500 text-2xl">End of Lesson</div>
          )}
        </div>

      </div>

      {/* Bottom Navigation */}
      <div className="h-24 flex items-center justify-between px-8 md:px-16 z-50">
        <button 
          onClick={() => activeBlockIndex > 0 && setActiveBlockIndex(prev => prev - 1)}
          disabled={activeBlockIndex === 0}
          className="p-4 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ArrowLeft size={32} />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 mx-8 max-w-md">
           <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
           </div>
           <div className="text-center text-xs text-slate-500 mt-2 font-mono">
             Slide {activeBlockIndex + 1} / {lesson.blocks.length}
           </div>
        </div>

        <button 
          onClick={() => activeBlockIndex < lesson.blocks.length - 1 && setActiveBlockIndex(prev => prev + 1)}
          disabled={activeBlockIndex === lesson.blocks.length - 1}
          className="p-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/50"
        >
          <ArrowRight size={32} />
        </button>
      </div>

    </div>
  );
};

export default PresentationMode;
