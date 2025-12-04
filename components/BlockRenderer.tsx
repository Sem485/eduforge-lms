
import React from 'react';
import { BlockType, LessonBlock, ViewerSettings } from '../types';
import { AlertCircle, Quote as QuoteIcon, CheckCircle, Info, AlertTriangle, ExternalLink } from 'lucide-react';

interface BlockRendererProps {
  block: LessonBlock;
  settings: ViewerSettings;
  className?: string;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, settings, className = '' }) => {
  // --- Style Calculators ---
  const getFontSize = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-base';
      case 'medium': return 'text-lg';
      case 'large': return 'text-2xl';
      case 'huge': return 'text-4xl leading-tight';
      default: return 'text-lg';
    }
  };

  const getThemeColors = () => {
    switch (settings.theme) {
      case 'dark': return 'text-slate-100';
      case 'sepia': return 'text-amber-900';
      default: return 'text-slate-800';
    }
  };

  const baseClasses = `${getFontSize()} ${getThemeColors()} ${className}`;

  // Helper for YouTube Embeds
  const getEmbedUrl = (url: string) => {
    try {
       if (url.includes('youtube.com/watch')) {
          const id = new URL(url).searchParams.get('v');
          return `https://www.youtube.com/embed/${id}`;
       }
       if (url.includes('youtu.be/')) {
          const id = url.split('youtu.be/')[1];
          return `https://www.youtube.com/embed/${id}`;
       }
    } catch(e) { return url; }
    return url;
  };

  // --- Renderers ---

  switch (block.type) {
    case BlockType.TEXT:
      return (
        <div className={`whitespace-pre-wrap leading-relaxed ${baseClasses} mb-6`}>
          {block.content}
        </div>
      );

    case BlockType.QUOTE:
      return (
        <div className="flex gap-4 my-8">
          <div className="flex-shrink-0">
             <QuoteIcon className={`opacity-30 ${settings.theme === 'dark' ? 'text-white' : 'text-slate-900'}`} size={settings.fontSize === 'huge' ? 48 : 32} />
          </div>
          <blockquote className={`${baseClasses} italic border-l-4 pl-6 ${settings.theme === 'dark' ? 'border-slate-600' : 'border-slate-300'}`}>
            {block.content}
          </blockquote>
        </div>
      );

    case BlockType.CALLOUT:
      const variant = block.metadata?.variant || 'info';
      // Adjust colors based on theme, simplified for readability
      const getCalloutStyles = () => {
        if (settings.theme === 'dark') {
          switch(variant) {
            case 'warning': return 'bg-orange-900/30 border-orange-700 text-orange-100';
            case 'success': return 'bg-green-900/30 border-green-700 text-green-100';
            case 'tip': return 'bg-purple-900/30 border-purple-700 text-purple-100';
            default: return 'bg-blue-900/30 border-blue-700 text-blue-100';
          }
        }
        switch(variant) {
          case 'warning': return 'bg-orange-50 border-orange-200 text-orange-900';
          case 'success': return 'bg-green-50 border-green-200 text-green-900';
          case 'tip': return 'bg-purple-50 border-purple-200 text-purple-900';
          default: return 'bg-blue-50 border-blue-200 text-blue-900';
        }
      };

      const Icon = () => {
        switch(variant) {
            case 'warning': return <AlertTriangle size={24} />;
            case 'success': return <CheckCircle size={24} />;
            default: return <Info size={24} />;
        }
      }

      return (
        <div className={`p-6 rounded-lg border ${getCalloutStyles()} flex gap-4 my-6 items-start`}>
          <div className="flex-shrink-0 mt-1 opacity-70"><Icon /></div>
          <div className={`${getFontSize()} font-medium`}>{block.content}</div>
        </div>
      );

    case BlockType.LIST:
      const isNum = block.metadata?.style?.listType === 'number';
      const items = block.content.split('\n').filter(i => i.trim());
      
      return (
        <div className={`my-6 ${baseClasses}`}>
           {isNum ? (
             <ol className="list-decimal pl-6 space-y-2">
               {items.map((item, i) => <li key={i}>{item}</li>)}
             </ol>
           ) : (
             <ul className="list-disc pl-6 space-y-2">
               {items.map((item, i) => <li key={i}>{item}</li>)}
             </ul>
           )}
        </div>
      );

    case BlockType.IMAGE:
      return (
        <div className="my-8 flex flex-col items-center">
          <img 
            src={block.content} 
            alt="Lesson content" 
            className="rounded-lg shadow-lg max-h-[80vh] object-contain bg-slate-100" 
          />
          {block.metadata?.caption && (
            <p className={`mt-3 text-center opacity-60 text-sm ${getThemeColors()}`}>
              {block.metadata.caption}
            </p>
          )}
        </div>
      );

    case BlockType.AUDIO:
      return (
        <div className={`my-8 p-4 rounded-xl border ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`text-xs uppercase font-bold tracking-wider mb-2 opacity-50 ${getThemeColors()}`}>Audio Track</div>
          <audio controls src={block.content} className="w-full" />
        </div>
      );

    case BlockType.VIDEO_LINK:
      const embed = getEmbedUrl(block.content);
      const isEmbed = embed !== block.content;
      return (
        <div className="my-8">
           {isEmbed ? (
             <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg bg-black">
                <iframe src={embed} className="w-full h-full" allowFullScreen frameBorder="0"></iframe>
             </div>
           ) : (
             <a 
               href={block.content} 
               target="_blank" 
               rel="noopener noreferrer" 
               className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:translate-x-1 ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-blue-50 hover:border-blue-200'}`}
             >
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                   <ExternalLink size={24} />
                </div>
                <div>
                   <div className={`font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Внешний ресурс</div>
                   <div className="text-sm opacity-60 truncate max-w-md">{block.content}</div>
                </div>
             </a>
           )}
        </div>
      );

    case BlockType.PDF_LINK:
       return (
         <div className="my-8">
            <a 
               href={block.content} 
               target="_blank" 
               rel="noopener noreferrer" 
               className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
             >
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                   <ExternalLink size={24} />
                </div>
                <span className="font-bold">Скачать PDF</span>
             </a>
         </div>
       );

    case BlockType.DIVIDER:
      return (
        <hr className={`my-12 border-0 h-px ${settings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />
      );

    default:
      return <div className="text-red-500 text-sm p-4 border border-red-200 rounded">Unsupported block type</div>;
  }
};
