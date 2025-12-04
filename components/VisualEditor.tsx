
import React, { useState } from 'react';
import { BlockType, LessonBlock } from '../types';
import { 
  Type, Image as ImageIcon, Music, Link as LinkIcon, 
  Quote, List, Minus, AlertCircle, GripVertical, Trash2, Copy, 
  ArrowDown, Settings, Video
} from 'lucide-react';

interface VisualEditorProps {
  blocks: LessonBlock[];
  onChange: (blocks: LessonBlock[]) => void;
  onUploadResource: (file: File) => Promise<string>;
}

const VisualEditor: React.FC<VisualEditorProps> = ({ blocks, onChange, onUploadResource }) => {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // --- ACTIONS ---

  const addBlock = (type: BlockType, index?: number) => {
    const newBlock: LessonBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: '',
      metadata: { style: { align: 'left' } }
    };
    
    if (index !== undefined) {
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      onChange(newBlocks);
    } else {
      onChange([...blocks, newBlock]);
    }
    setActiveBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<LessonBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const updateMetadata = (id: string, metaUpdates: Record<string, any>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, metadata: { ...b.metadata, ...metaUpdates } } : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
    if (activeBlockId === id) setActiveBlockId(null);
  };

  const duplicateBlock = (block: LessonBlock) => {
    const newBlock = { ...block, id: Math.random().toString(36).substr(2, 9) };
    const idx = blocks.findIndex(b => b.id === block.id);
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, newBlock);
    onChange(newBlocks);
  };

  // --- DRAG AND DROP HANDLERS ---

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedBlockIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
    if (draggedBlockIndex === null) return;
    if (draggedBlockIndex !== index) {
       setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedBlockIndex !== null && dragOverIndex !== null && draggedBlockIndex !== dragOverIndex) {
      const newBlocks = [...blocks];
      const [removed] = newBlocks.splice(draggedBlockIndex, 1);
      newBlocks.splice(dragOverIndex, 0, removed);
      onChange(newBlocks);
    }
    setDraggedBlockIndex(null);
    setDragOverIndex(null);
  };

  const handleFileUpload = async (blockId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const url = await onUploadResource(e.target.files[0]);
        updateBlock(blockId, { content: url });
      } catch (err) {
        alert("Загрузка не удалась");
      }
    }
  };

  // --- RENDERERS ---

  const renderBlockContent = (block: LessonBlock) => {
    switch (block.type) {
      case BlockType.TEXT:
        return (
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            placeholder="Введите текст здесь..."
            className="w-full bg-white border border-slate-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-lg leading-relaxed placeholder-slate-400"
            style={{ height: 'auto', minHeight: '80px' }}
            onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
            }}
          />
        );
      
      case BlockType.QUOTE:
        return (
          <div className="flex">
            <div className="w-1 bg-slate-300 mr-4 rounded-full"></div>
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Введите цитату..."
              className="w-full bg-white border border-slate-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-600 italic text-xl placeholder-slate-400"
            />
          </div>
        );

      case BlockType.CALLOUT:
        const variant = block.metadata?.variant || 'info';
        const styles = {
          info: 'bg-blue-50 border-blue-200 text-blue-900',
          warning: 'bg-orange-50 border-orange-200 text-orange-900',
          success: 'bg-green-50 border-green-200 text-green-900',
          tip: 'bg-purple-50 border-purple-200 text-purple-900',
        };
        return (
          <div className={`p-4 rounded-lg border ${styles[variant]} flex gap-3`}>
            <AlertCircle className="flex-shrink-0 mt-1 opacity-50" size={20} />
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Текст уведомления..."
              className="w-full bg-white/50 border border-transparent focus:border-blue-300 rounded p-2 resize-none focus:ring-0 text-inherit font-medium placeholder-slate-400"
            />
          </div>
        );

      case BlockType.LIST:
        return (
          <div className="flex gap-2">
            <div className="pt-3 text-slate-400">
               {block.metadata?.style?.listType === 'number' ? '1.' : '•'}
            </div>
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Элементы списка (по одному в строке)..."
              className="w-full bg-white border border-slate-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 leading-8 placeholder-slate-400"
            />
          </div>
        );

      case BlockType.IMAGE:
        return (
          <div className="space-y-2">
            {block.content ? (
              <div className="relative group/img">
                <img src={block.content} alt="Block" className="max-h-96 w-full object-contain rounded-lg bg-slate-100 border border-slate-200" />
                <button 
                  onClick={() => updateBlock(block.id, { content: '' })} 
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded transition-opacity opacity-0 group-hover/img:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors bg-white">
                <ImageIcon size={32} className="text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-500">Нажмите для загрузки изображения</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(block.id, e)} />
              </label>
            )}
            <input 
              value={block.metadata?.caption || ''}
              onChange={(e) => updateMetadata(block.id, { caption: e.target.value })}
              placeholder="Подпись (необязательно)..."
              className="w-full text-center text-sm text-slate-600 bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
            />
          </div>
        );

      case BlockType.AUDIO:
         return (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
               <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                     <Music size={20} />
                  </div>
                  <span className="font-semibold text-slate-700">Аудио трек</span>
               </div>
               {block.content ? (
                  <audio controls src={block.content} className="w-full" />
               ) : (
                  <label className="block w-full text-center py-4 border-2 border-dashed border-slate-300 rounded-lg hover:bg-white cursor-pointer bg-slate-50">
                     <span className="text-sm text-blue-600">Загрузить MP3/WAV</span>
                     <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(block.id, e)} />
                  </label>
               )}
            </div>
         );

      case BlockType.VIDEO_LINK:
        return (
          <div className="bg-white p-4 rounded-lg border border-slate-300">
            <div className="flex items-center gap-2 mb-2 text-slate-600 font-medium">
               <Video size={18} />
               <span>Видео или Ресурс</span>
            </div>
            <input 
              type="text" 
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Вставьте ссылку на YouTube, Vimeo или PDF..."
              className="w-full bg-white border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
            />
            {block.content && (
              <div className="mt-2 text-xs text-slate-500">
                Ссылка добавлена. Она будет отображена как плеер или кнопка в режиме просмотра.
              </div>
            )}
          </div>
        );

      case BlockType.DIVIDER:
        return <div className="h-px w-full bg-slate-200 my-8 relative flex justify-center"><span className="bg-white px-2 text-xs text-slate-300 absolute -top-2">Разделитель</span></div>;

      default:
        return <div className="text-red-500">Неизвестный тип блока</div>;
    }
  };

  // --- RENDER ---

  const activeBlock = blocks.find(b => b.id === activeBlockId);

  return (
    <div className="flex h-full overflow-hidden">
      {/* CANVAS (Center) */}
      <div className="flex-1 overflow-y-auto bg-slate-100 p-8 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-2 pb-32">
          
          {blocks.length === 0 && (
            <div className="text-center py-24">
              <h3 className="text-xl font-bold text-slate-700 mb-2">Начните создание урока</h3>
              <p className="text-slate-500 mb-8">Выберите тип блока в меню ниже.</p>
            </div>
          )}

          {blocks.map((block, index) => (
            <div 
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              onClick={() => setActiveBlockId(block.id)}
              className={`group relative transition-all duration-200 ${dragOverIndex === index ? 'pt-20' : ''}`}
            >
              {/* Insert Between Trigger */}
              <div className="absolute -top-3 left-0 w-full h-6 z-10 opacity-0 hover:opacity-100 flex items-center justify-center group-hover/gap:opacity-100 transition-opacity cursor-pointer">
                  <div className="w-full h-px bg-blue-500 mx-4"></div>
                  <button className="bg-blue-500 text-white rounded-full p-1 shadow-sm transform hover:scale-110" onClick={(e) => { e.stopPropagation(); addBlock(BlockType.TEXT, index - 1); }}>
                    <ArrowDown size={14} />
                  </button>
                  <div className="w-full h-px bg-blue-500 mx-4"></div>
              </div>

              {/* Block Card */}
              <div className={`
                relative bg-white rounded-xl border-2 transition-all p-2 pl-4
                ${activeBlockId === block.id ? 'border-blue-500 shadow-md ring-4 ring-blue-50' : 'border-transparent hover:border-slate-200 hover:shadow-sm'}
                ${draggedBlockIndex === index ? 'opacity-50' : 'opacity-100'}
              `}>
                {/* Drag Handle & Tools (Visible on Hover/Active) */}
                <div className={`absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center py-2 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                   <div className="cursor-move text-slate-400 hover:text-slate-600 p-1" title="Перетащить">
                      <GripVertical size={16} />
                   </div>
                   <div className="flex-1"></div>
                   <button onClick={(e) => {e.stopPropagation(); duplicateBlock(block)}} className="text-slate-400 hover:text-blue-600 p-1" title="Дублировать">
                      <Copy size={14} />
                   </button>
                   <button onClick={(e) => {e.stopPropagation(); removeBlock(block.id)}} className="text-slate-400 hover:text-red-600 p-1" title="Удалить">
                      <Trash2 size={14} />
                   </button>
                </div>

                {/* Content */}
                <div className="pl-6 pr-4 py-2">
                  {renderBlockContent(block)}
                </div>
              </div>
            </div>
          ))}
          
          {/* Bottom Add Area */}
          <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500 transition-all cursor-pointer bg-white" onClick={() => addBlock(BlockType.TEXT)}>
             <span className="font-medium flex items-center gap-2"><ArrowDown size={18} /> Добавить блок в конец</span>
          </div>
        </div>
      </div>

      {/* PROPERTIES PANEL (Right) */}
      <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto flex flex-col">
         <div className="p-4 border-b border-slate-100">
           <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider mb-1">Свойства блока</h3>
           <p className="text-sm text-slate-500">{activeBlock ? activeBlock.type : 'Блок не выбран'}</p>
         </div>

         <div className="flex-1 p-4 space-y-6">
            {!activeBlock ? (
              <div className="text-center text-slate-400 mt-10">
                <Settings size={48} className="mx-auto mb-4 opacity-20" />
                <p>Выберите блок для редактирования.</p>
              </div>
            ) : (
              <>
                 {/* Common Properties */}
                 {activeBlock.type === BlockType.CALLOUT && (
                   <div>
                     <label className="text-xs font-bold text-slate-500 mb-2 block">Стиль</label>
                     <div className="grid grid-cols-2 gap-2">
                       {['info', 'warning', 'success', 'tip'].map(v => (
                         <button 
                           key={v}
                           onClick={() => updateMetadata(activeBlock.id, { variant: v })}
                           className={`p-2 rounded border text-sm capitalize ${activeBlock.metadata?.variant === v ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200 text-slate-600'}`}
                         >
                           {v}
                         </button>
                       ))}
                     </div>
                   </div>
                 )}

                 {activeBlock.type === BlockType.LIST && (
                   <div>
                     <label className="text-xs font-bold text-slate-500 mb-2 block">Тип списка</label>
                     <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                       <button onClick={() => updateMetadata(activeBlock.id, { style: { ...activeBlock.metadata?.style, listType: 'bullet' } })} className={`flex-1 py-2 text-sm ${activeBlock.metadata?.style?.listType !== 'number' ? 'bg-slate-100 font-bold' : 'bg-white'}`}>Маркеры</button>
                       <div className="w-px bg-slate-200"></div>
                       <button onClick={() => updateMetadata(activeBlock.id, { style: { ...activeBlock.metadata?.style, listType: 'number' } })} className={`flex-1 py-2 text-sm ${activeBlock.metadata?.style?.listType === 'number' ? 'bg-slate-100 font-bold' : 'bg-white'}`}>Числа</button>
                     </div>
                   </div>
                 )}

                 <div>
                   <label className="text-xs font-bold text-slate-500 mb-2 block">Действия</label>
                   <button onClick={() => removeBlock(activeBlock.id)} className="w-full flex items-center justify-center space-x-2 p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                     <Trash2 size={16} /> <span>Удалить блок</span>
                   </button>
                 </div>
              </>
            )}
         </div>

         {/* Sticky Toolbar at Bottom of Right Panel */}
         <div className="p-4 border-t border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider mb-3">Добавить</h3>
            <div className="grid grid-cols-2 gap-2">
               <button onClick={() => addBlock(BlockType.TEXT)} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 text-sm"><Type size={16} /> Текст</button>
               <button onClick={() => addBlock(BlockType.IMAGE)} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 text-sm"><ImageIcon size={16} /> Фото</button>
               <button onClick={() => addBlock(BlockType.LIST)} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 text-sm"><List size={16} /> Список</button>
               <button onClick={() => addBlock(BlockType.CALLOUT)} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 text-sm"><AlertCircle size={16} /> Выноска</button>
               <button onClick={() => addBlock(BlockType.QUOTE)} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 text-sm"><Quote size={16} /> Цитата</button>
               <button onClick={() => addBlock(BlockType.VIDEO_LINK)} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 text-sm"><Video size={16} /> Видео/Link</button>
               <button onClick={() => addBlock(BlockType.DIVIDER)} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 text-sm"><Minus size={16} /> Линия</button>
               <button onClick={() => addBlock(BlockType.AUDIO)} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 text-sm"><Music size={16} /> Аудио</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default VisualEditor;
