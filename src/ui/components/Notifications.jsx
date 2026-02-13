/**
 * Notification / toast system.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import './Notifications.css';

const NotificationContext = createContext(null);

let notificationCounter = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = `notification-${++notificationCounter}`;
    const newNotification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration ?? 5000,
      dismissible: notification.dismissible ?? true,
    };

    setNotifications((previous) => [...previous, newNotification]);
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const success = useCallback((title, message, options = {}) => (
    addNotification({ type: 'success', title, message, ...options })
  ), [addNotification]);

  const error = useCallback((title, message, options = {}) => (
    addNotification({ type: 'error', title, message, duration: 0, ...options })
  ), [addNotification]);

  const warning = useCallback((title, message, options = {}) => (
    addNotification({ type: 'warning', title, message, duration: 8000, ...options })
  ), [addNotification]);

  const info = useCallback((title, message, options = {}) => (
    addNotification({ type: 'info', title, message, ...options })
  ), [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

function NotificationContainer({ notifications, onDismiss }) {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => onDismiss(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationItem({ notification, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onDismiss, 250);
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 250);
  };

  const icons = {
    success: 'OK',
    error: 'ER',
    warning: 'WR',
    info: 'IN',
  };

  return (
    <div className={`notification notification-${notification.type} ${isExiting ? 'notification-exit' : ''}`}>
      <div className="notification-icon">{icons[notification.type]}</div>
      <div className="notification-content">
        <div className="notification-title">{notification.title}</div>
        {notification.message && <div className="notification-message">{notification.message}</div>}
        {notification.action && (
          <button
            type="button"
            className="notification-action"
            onClick={() => {
              notification.action.onClick();
              handleDismiss();
            }}
          >
            {notification.action.label}
          </button>
        )}
      </div>
      {notification.dismissible && (
        <button type="button" className="notification-dismiss" onClick={handleDismiss}>x</button>
      )}
    </div>
  );
}
