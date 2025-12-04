
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { NotificationType } from '../types';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  addNotification: (type: NotificationType, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-white transform transition-all animate-in slide-in-from-right-full fade-in duration-300 ${
              n.type === 'success' ? 'bg-green-600' : 
              n.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
            }`}
          >
            {n.type === 'success' && <CheckCircle size={18} className="shrink-0" />}
            {n.type === 'error' && <AlertCircle size={18} className="shrink-0" />}
            {n.type === 'info' && <Info size={18} className="shrink-0" />}
            <span className="text-sm font-medium">{n.message}</span>
            <button onClick={() => removeNotification(n.id)} className="ml-2 hover:bg-white/20 rounded p-1 transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
