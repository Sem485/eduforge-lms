
import React from 'react';
import { Save } from 'lucide-react';

const AdminSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Настройки системы</h1>
          <p className="text-slate-500">Настройка глобальных параметров платформы.</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Save size={18} />
          <span>Сохранить изменения</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Общие</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Название платформы</label>
              <input type="text" defaultValue="EduForge LMS" className="w-full md:w-1/2 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email поддержки</label>
              <input type="email" defaultValue="support@eduforge.local" className="w-full md:w-1/2 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="maint" className="rounded text-blue-600 focus:ring-blue-500" />
              <label htmlFor="maint" className="text-sm text-slate-700">Включить режим обслуживания</label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Безопасность и Доступ</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Тайм-аут сессии (минуты)</label>
              <input type="number" defaultValue="1440" className="w-full md:w-1/4 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="reg" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
              <label htmlFor="reg" className="text-sm text-slate-700">Разрешить регистрацию преподавателей (Публичную)</label>
            </div>
          </div>
        </div>

        {/* Storage Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Лимиты хранилища</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Макс. размер файла (МБ)</label>
              <input type="number" defaultValue="50" className="w-full md:w-1/4 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Общий объем на пользователя (МБ)</label>
              <input type="number" defaultValue="1000" className="w-full md:w-1/4 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;
