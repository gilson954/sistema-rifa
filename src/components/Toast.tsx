import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 5000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          gradient: 'from-green-500/90 to-emerald-500/90',
          icon: CheckCircle,
          iconColor: 'text-white',
          borderColor: 'border-green-500/20',
        };
      case 'error':
        return {
          gradient: 'from-red-500/90 to-rose-500/90',
          icon: XCircle,
          iconColor: 'text-white',
          borderColor: 'border-red-500/20',
        };
      case 'warning':
        return {
          gradient: 'from-amber-500/90 to-orange-500/90',
          icon: AlertTriangle,
          iconColor: 'text-white',
          borderColor: 'border-amber-500/20',
        };
      case 'info':
        return {
          gradient: 'from-blue-500/90 to-indigo-500/90',
          icon: Info,
          iconColor: 'text-white',
          borderColor: 'border-blue-500/20',
        };
      default:
        return {
          gradient: 'from-gray-500/90 to-gray-600/90',
          icon: Info,
          iconColor: 'text-white',
          borderColor: 'border-gray-500/20',
        };
    }
  };

  const styles = getToastStyles();
  const Icon = styles.icon;

  return (
    <div
      className={`
        relative flex items-center gap-3 min-w-[320px] max-w-md p-4 rounded-xl
        bg-gradient-to-r ${styles.gradient}
        backdrop-blur-sm border ${styles.borderColor}
        shadow-lg hover:shadow-xl
        transition-all duration-300 transform
        animate-slide-in-right
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <Icon className={`h-5 w-5 ${styles.iconColor}`} />
      </div>

      {/* Message */}
      <div className="flex-1 text-sm font-medium text-white">
        {message}
      </div>

      {/* Close button */}
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors duration-200"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4 text-white" />
      </button>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-white/40 animate-progress"
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
