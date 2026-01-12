// lib/toast.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastType } from '@/components/ui/Toast';
import { hapticSuccess, hapticError, hapticWarning } from '@/lib/haptics';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');

  const showToast = useCallback((msg: string, toastType: ToastType = 'success') => {
    // Haptic feedback based on type
    switch (toastType) {
      case 'success':
        hapticSuccess();
        break;
      case 'error':
        hapticError();
        break;
      case 'warning':
        hapticWarning();
        break;
    }
    
    setMessage(msg);
    setType(toastType);
    setVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        message={message}
        type={type}
        visible={visible}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}