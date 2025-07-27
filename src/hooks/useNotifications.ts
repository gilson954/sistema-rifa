import { useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Custom hook for managing in-app notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for different notification types
  const showSuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'success', title, message, ...options });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'error', title, message, duration: 0, ...options });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'warning', title, message, ...options });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'info', title, message, ...options });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}