import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Toast, { ToastType } from '@/components/Toast';
import { registerToastHandler } from '@/utils/errorHandler';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [duration, setDuration] = useState(3000);

  const showToast = (msg: string, toastType: ToastType = 'info', toastDuration: number = 3000) => {
    setMessage(msg);
    setType(toastType);
    setDuration(toastDuration);
    setVisible(true);
  };

  // Enregistrer le handler global
  useEffect(() => {
    registerToastHandler(showToast);
  }, []);

  const hideToast = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        message={message}
        type={type}
        duration={duration}
        visible={visible}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast doit être utilisé dans ToastProvider');
  }
  return context;
}
