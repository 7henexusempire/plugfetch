import React from 'react';
import { CheckCircle2, AlertTriangle, Info, Loader2, X } from 'lucide-react';
import { ToastItem } from '../types';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isLoading = toast.type === 'loading';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slideUp ${
              isSuccess
                ? 'bg-slate-900/95 border-amber-400/40 shadow-amber-500/20 text-slate-100'
                : isError
                ? 'bg-slate-900/95 border-rose-500/80 shadow-rose-950/50 text-rose-100'
                : isLoading
                ? 'bg-slate-900/95 border-indigo-500/80 shadow-indigo-950/50 text-indigo-100'
                : 'bg-slate-900/95 border-slate-700 shadow-slate-950/50 text-slate-200'
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-amber-400 animate-pulse" />}
              {isError && <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />}
              {isLoading && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
              {!isSuccess && !isError && !isLoading && <Info className="w-5 h-5 text-slate-400" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <h5 className="text-xs font-bold tracking-tight text-white">{toast.title}</h5>
              {toast.message && (
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed break-words font-mono">
                  {toast.message}
                </p>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
