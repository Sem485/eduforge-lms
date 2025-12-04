
import React, { useState, useEffect } from 'react';
import { server } from '../services/server';
import { authService } from '../services/auth';
import { LogEntry } from '../types';
import { Search } from 'lucide-react';

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const token = authService.getToken();
      if (token) {
        const res = await server.admin.getLogs(token);
        if (res.data) setLogs(res.data);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.username.toLowerCase().includes(filter.toLowerCase()) || 
    l.action.toLowerCase().includes(filter.toLowerCase()) ||
    l.details.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Системные логи</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Фильтр логов..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 text-slate-900"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Время</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Пользователь</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Действие</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Детали</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Загрузка логов...</td></tr>
              ) : filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-4 text-sm text-slate-500 whitespace-nowrap font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4 text-sm font-medium text-slate-900 whitespace-nowrap">{log.username}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded bg-slate-100 text-xs font-mono font-bold text-slate-700">{log.action}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{log.details}</td>
                </tr>
              ))}
              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">Логов не найдено.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;
