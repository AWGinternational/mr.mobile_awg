'use client';

import * as React from 'react';
import { useToast } from './use-toast';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            animate-in slide-in-from-top-full duration-300
            rounded-lg shadow-lg p-4 pr-8 relative
            ${toast.variant === 'destructive' 
              ? 'bg-red-600 dark:bg-red-700 text-white' 
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }
          `}
        >
          <button
            onClick={() => dismiss(toast.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-start gap-3">
            {toast.variant === 'destructive' ? (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-white" />
            ) : (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-600 dark:text-green-500" />
            )}
            
            <div className="flex-1">
              {toast.title && (
                <div className={`font-semibold mb-1 ${
                  toast.variant === 'destructive' 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {toast.title}
                </div>
              )}
              {toast.description && (
                <div className={`text-sm ${
                  toast.variant === 'destructive' 
                    ? 'text-white/90' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {toast.description}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
