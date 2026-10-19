import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (options: { type?: 'success' | 'error' | 'info'; title?: string; message: string }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message }: { type?: 'success' | 'error' | 'info'; title?: string; message: string }) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts(prev => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = (message: string, title?: string) => addToast({ type: 'success', title, message });
  const error = (message: string, title?: string) => addToast({ type: 'error', title, message });
  const info = (message: string, title?: string) => addToast({ type: 'info', title, message });

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      {/* Toast container floating bottom-right (LTR) / bottom-left (RTL) */}
      <div className="fixed bottom-4 right-4 rtl:right-auto rtl:left-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto p-3.5 rounded-xl border shadow-lg flex items-start gap-3 bg-white transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200',
              t.type === 'success' && 'border-emerald-200 text-slate-800',
              t.type === 'error' && 'border-rose-200 text-slate-800',
              t.type === 'info' && 'border-brand-200 text-slate-800'
            )}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs">
              {t.title && <h5 className="font-semibold text-slate-900 mb-0.5">{t.title}</h5>}
              <p className="text-slate-600">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
