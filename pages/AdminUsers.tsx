
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { server } from '../services/server';
import { authService } from '../services/auth';
import { Shield, User as UserIcon, Trash2, Plus, Search } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', fullName: '', role: UserRole.INSTRUCTOR });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const { addNotification } = useNotification();

  const fetchUsers = async () => {
    setLoading(true);
    const token = authService.getToken();
    if (token) {
      const res = await server.admin.listUsers(token);
      if (res.data) setUsers(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = authService.getToken();
    if (!token) return;

    try {
      const res = await server.admin.createUser(token, newUser);
      if (res.data) {
        setShowAdd(false);
        setNewUser({ username: '', fullName: '', role: UserRole.INSTRUCTOR });
        addNotification('success', `Пользователь ${res.data.username} создан`);
        fetchUsers();
      }
    } catch (e) {
      addNotification('error', 'Не удалось создать пользователя');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить пользователя?')) return;
    const token = authService.getToken();
    if (!token) return;

    await server.admin.deleteUser(token, id);
    addNotification('info', 'Пользователь удален');
    fetchUsers();
  };

  const filteredUsers = users.filter(u => u.fullName.toLowerCase().includes(filter.toLowerCase()) || u.username.toLowerCase().includes(filter.toLowerCase()));

  if (loading) return <div>Загрузка пользователей...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Управление пользователями</h1>
           <p className="text-slate-500">Управление доступом и ролями платформы.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-bold transition-all">
          <Plus size={18} />
          <span>Добавить</span>
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold mb-4 text-slate-800">Создать нового пользователя</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Имя пользователя</label>
              <input required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 text-slate-900" placeholder="jdoe" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Полное имя</label>
              <input required value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 text-slate-900" placeholder="Иван Иванов" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Роль</label>
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900">
                <option value={UserRole.INSTRUCTOR}>Преподаватель</option>
                <option value={UserRole.ADMIN}>Администратор</option>
              </select>
            </div>
            <button type="submit" className="bg-green-600 text-white p-2.5 rounded-lg hover:bg-green-700 font-bold w-full transition-colors">Создать</button>
          </form>
        </div>
      )}

      {/* Search & List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
           <div className="relative max-w-sm">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
             <input 
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 text-slate-900"
               placeholder="Поиск пользователей..." 
             />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Пользователь</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Роль</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Дата регистрации</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{u.fullName}</p>
                        <p className="text-xs text-slate-500">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold border ${u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                      {u.role === UserRole.ADMIN && <Shield size={10} />}
                      <span>{u.role === UserRole.ADMIN ? 'Админ' : 'Преподаватель'}</span>
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    {u.username !== 'hrumba' && (
                      <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Удалить">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
