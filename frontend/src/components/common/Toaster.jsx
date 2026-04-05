import { useState, useEffect } from 'react';

let toastFn = null;

export const toast = {
  success: (msg) => toastFn?.('success', msg),
  error: (msg) => toastFn?.('error', msg),
  info: (msg) => toastFn?.('info', msg),
};

export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastFn = (type, message) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    return () => { toastFn = null; };
  }, []);

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm w-full px-4">
      {toasts.map(t => (
        <div key={t.id} className={`${colors[t.type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium animate-fade-in`}>
          <span>{icons[t.type]}</span>
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
