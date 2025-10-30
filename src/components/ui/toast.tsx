'use client';

import * as React from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';

export interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastProps extends ToastData {
  onClose: () => void;
}

export function Toast({ id, title, description, variant = 'default', onClose }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = variant === 'destructive' ? 'bg-red-500' : 'bg-green-500';
  const Icon = variant === 'destructive' ? XCircle : CheckCircle2;

  return (
    <div
      className={`transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`${bgColor} text-white rounded-lg shadow-2xl p-4 pr-12 min-w-[320px] max-w-md relative`}>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            {title && <div className="font-semibold text-sm mb-1">{title}</div>}
            {description && <div className="text-sm opacity-95">{description}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Toaster({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}
