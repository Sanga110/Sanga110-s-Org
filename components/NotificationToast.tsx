import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationToastProps {
  notification: NotificationItem;
  onClose: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000); // Auto dismiss after 5s
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      borderColor: 'border-emerald-500/50',
      bgColor: 'bg-neutral-900',
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      borderColor: 'border-red-500/50',
      bgColor: 'bg-neutral-900',
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500" />,
      borderColor: 'border-blue-500/50',
      bgColor: 'bg-neutral-900',
    },
    warning: {
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        borderColor: 'border-amber-500/50',
        bgColor: 'bg-neutral-900',
      },
  };

  const style = config[notification.type];

  return (
    <div className={`
      flex items-start gap-3 w-full md:min-w-[320px] max-w-sm 
      ${style.bgColor} border ${style.borderColor} 
      p-4 rounded-lg shadow-2xl shadow-black/50 
      animate-slide-in pointer-events-auto relative
      backdrop-blur-sm bg-opacity-95
    `}>
      <div className="shrink-0 mt-0.5">
        {style.icon}
      </div>
      <div className="flex-1 pr-2">
        <p className="text-sm font-bold text-white leading-tight">
          {notification.message}
        </p>
      </div>
      <button 
        onClick={() => onClose(notification.id)}
        className="text-neutral-500 hover:text-white transition-colors absolute top-2 right-2"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};