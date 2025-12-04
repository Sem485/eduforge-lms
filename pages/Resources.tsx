
import React, { useState, useEffect } from 'react';
import { ResourceFile, ResourceFolder } from '../types';
import { server } from '../services/server';
import { authService } from '../services/auth';
import { File, Trash2, Copy, Search, Image, Music, FileText, Folder, FolderPlus, Upload, ChevronRight, Home, CornerUpLeft } from 'lucide-react';

const Resources: React.FC = () => {
  const [resources, setResources] = useState<ResourceFile[]>([]);
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string | null, name: string}[]>([{id: null, name: 'Домой'}]);
  
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const token = authService.getToken();
    if (token) {
      const [filesRes, foldersRes] = await Promise.all([
        server.resources.list(token, currentFolderId),
        server.folders.list(token, currentFolderId)
      ]);
      
      if (filesRes.data) setResources(filesRes.data);
      if (foldersRes.data) setFolders(foldersRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentFolderId]);

  const handleFolderCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    const token = authService.getToken();
    if (token) {
      await server.folders.create(token, newFolderName, currentFolderId);
      setNewFolderName('');
      setIsCreatingFolder(false);
      fetchData();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const token = authService.getToken();
      if (token) {
        await server.resources.upload(token, e.target.files[0], currentFolderId);
        fetchData();
      }
    }
  };

  const handleNavigate = (folderId: string | null, folderName: string) => {
    setCurrentFolderId(folderId);
    if (folderId === null) {
      setBreadcrumbs([{id: null, name: 'Домой'}]);
    } else {
      setBreadcrumbs(prev => [...prev, {id: folderId, name: folderName}]);
    }
  };

  const handleNavigateUp = () => {
    if (breadcrumbs.length > 1) {
      const parent = breadcrumbs[breadcrumbs.length - 2];
      setBreadcrumbs(prev => prev.slice(0, prev.length - 1));
      setCurrentFolderId(parent.id);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Безвозвратно удалить этот файл?')) return;
    const token = authService.getToken();
    if (token) {
      await server.resources.delete(token, id);
      fetchData();
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Удалить папку И все её содержимое?')) return;
    const token = authService.getToken();
    if (token) {
      await server.folders.delete(token, id);
      fetchData();
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Ссылка скопирована в буфер обмена');
  };

  const getIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <Image size={24} className="text-blue-500" />;
    if (mime.startsWith('audio/')) return <Music size={24} className="text-purple-500" />;
    return <FileText size={24} className="text-slate-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  };

  const filteredResources = resources.filter(r => r.name.toLowerCase().includes(filter.toLowerCase()));
  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Менеджер ресурсов</h1>
          <p className="text-slate-500">Управляйте файлами и активами курса.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
            className="flex items-center space-x-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors"
          >
            <FolderPlus size={18} />
            <span>Новая папка</span>
          </button>
          
          <label className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm">
            <Upload size={18} />
            <span>Загрузить файл</span>
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center space-x-2 text-sm">
        {breadcrumbs.length > 1 && (
           <button onClick={handleNavigateUp} className="p-1 hover:bg-slate-100 rounded mr-2" title="На уровень вверх">
             <CornerUpLeft size={16} />
           </button>
        )}
        
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.name + index}>
            {index > 0 && <ChevronRight size={14} className="text-slate-400" />}
            <button 
              onClick={() => {
                // Reset breadcrumbs up to this point
                const newCrumbs = breadcrumbs.slice(0, index + 1);
                setBreadcrumbs(newCrumbs);
                setCurrentFolderId(crumb.id);
              }}
              className={`flex items-center hover:text-blue-600 ${index === breadcrumbs.length - 1 ? 'font-bold text-slate-900' : 'text-slate-500'}`}
            >
              {index === 0 && <Home size={14} className="mr-1" />}
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {isCreatingFolder && (
        <form onSubmit={handleFolderCreate} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex gap-2 items-center">
          <Folder size={20} className="text-slate-400" />
          <input 
            autoFocus
            type="text" 
            placeholder="Имя папки" 
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            className="flex-1 p-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 text-slate-900"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Создать</button>
          <button type="button" onClick={() => setIsCreatingFolder(false)} className="text-slate-500 hover:text-slate-700 px-2">Отмена</button>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Фильтр текущего вида..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 text-slate-900"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Загрузка ресурсов...</div>
      ) : filteredResources.length === 0 && filteredFolders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <Folder size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500">Эта папка пуста.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase w-1/2">Имя</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Размер</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Использование</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Folders */}
              {filteredFolders.map(folder => (
                <tr key={folder.id} className="hover:bg-slate-50 cursor-pointer group" onClick={() => handleNavigate(folder.id, folder.name)}>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-500">
                        <Folder size={24} fill="currentColor" className="opacity-80" />
                      </div>
                      <div className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{folder.name}</div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-400">-</td>
                  <td className="p-4 text-sm text-slate-400">-</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} 
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Удалить папку"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Files */}
              {filteredResources.map(file => (
                <tr key={file.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        {getIcon(file.type)}
                      </div>
                      <div>
                         <div className="font-medium text-slate-700 max-w-xs truncate" title={file.name}>{file.name}</div>
                         <div className="text-xs text-slate-400">{new Date(file.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-mono">{formatSize(file.size)}</td>
                  <td className="p-4">
                    {file.usageReferences.length > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-medium">
                        Используется в {file.usageReferences.length} ур.
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Не используется</span>
                    )}
                  </td>
                  <td className="p-4 text-right flex justify-end space-x-2">
                    <button onClick={() => copyLink(file.url)} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors" title="Копировать ссылку">
                      <Copy size={16} />
                    </button>
                    <button onClick={() => handleDeleteFile(file.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors" title="Удалить файл">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Resources;
