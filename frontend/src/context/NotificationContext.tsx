"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { ToastContext } from './ToastContext';

export interface NotificationContextType {
  notifications: any[];
  unreadCount: number;
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const toastCtx = useContext(ToastContext);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.warn("Failed fetching notifications:", err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.warn("Failed marking notification as read:", err);
      await fetchNotifications(); // rollback
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await api.put('/notifications/read-all');
      toastCtx?.addToast('success', 'All notifications marked as read');
    } catch (err) {
      console.warn("Failed marking all notifications as read:", err);
      await fetchNotifications(); // rollback
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.filter(n => n.id !== id));
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.warn("Failed deleting notification:", err);
      await fetchNotifications(); // rollback
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        setNotifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
