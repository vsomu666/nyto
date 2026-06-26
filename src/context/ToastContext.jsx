import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x));
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 220);
  }, []);

  const show = useCallback((message, type = 'success', duration = 3200) => {
    const id = nextId++;
    const icons = { success: '✓', error: '✕', info: 'i', warning: '!' };
    setToasts(t => [...t.slice(-4), { id, message, type, icon: icons[type] || '✓', exiting: false }]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  // Convenience shortcuts
  const showToast    = useCallback((msg) => show(msg, 'success'), [show]);
  const showError    = useCallback((msg) => show(msg, 'error', 4000), [show]);
  const showInfo     = useCallback((msg) => show(msg, 'info'), [show]);
  const showWarning  = useCallback((msg) => show(msg, 'warning'), [show]);

  return (
    <ToastContext.Provider value={{ showToast, showError, showInfo, showWarning, show, dismiss }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast-item toast-${t.type}${t.exiting ? ' exiting' : ''}`}
          onClick={() => onDismiss(t.id)}
        >
          <div className="toast-icon">{t.icon}</div>
          <div className="toast-text">{t.message}</div>
          <div className="toast-close">✕</div>
        </div>
      ))}
    </div>
  );
}
