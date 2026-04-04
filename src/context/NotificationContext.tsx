"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useMemo } from "react";
import { useAuth, supabase } from "@/context/AuthContext";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  tipe: "info" | "success" | "warning" | "error";
  dibaca: boolean;
  link?: string;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Store processed notification IDs to prevent duplicates
const processedNotificationIds = new Set<string>();

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const channelRef = useRef<any>(null);
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    if (user?.id) {
      refreshNotifications();

      // Clean up existing channel if any
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
      }

      // Subscribe to real-time notifications
      const channel = supabase!
        .channel('notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            const newNotif = payload.new as Notification;
            
            // Prevent duplicate: check if already exists in state
            setNotifications(prev => {
              const exists = prev.some(n => n.id === newNotif.id);
              if (exists) {
                return prev; // Don't add duplicate
              }
              processedNotificationIds.add(newNotif.id);
              return [newNotif, ...prev];
            });
          }
        )
        .subscribe();

      channelRef.current = channel;

      return () => {
        if (channelRef.current) {
          supabase?.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };
    } else {
      setNotifications([]);
      processedNotificationIds.clear();
    }
  }, [user]);

  async function refreshNotifications() {
    if (!supabase || !user?.id) return;

    // Debounce: prevent refresh too frequently (min 1 second)
    const now = Date.now();
    if (now - lastRefreshRef.current < 1000) {
      return;
    }
    lastRefreshRef.current = now;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      console.log('🔔 Notifications fetched:', data.length, 'notifications');
      
      // Remove duplicates based on ID
      const uniqueNotifications = data.filter((n, i, arr) => 
        arr.findIndex(x => x.id === n.id) === i
      );
      
      console.log('🔔 Unique notifications:', uniqueNotifications.length);
      if (uniqueNotifications.length > 0) {
        console.log('🔔 First notification:', uniqueNotifications[0]);
      }
      
      setNotifications(uniqueNotifications);
      
      // Mark processed IDs
      uniqueNotifications.forEach(n => processedNotificationIds.add(n.id));
    } else if (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  }

  async function markAsRead(id: string) {
    if (!supabase) return;

    console.log('🗑️ Deleting notification:', id);

    // Optimistic update: remove from UI immediately
    setNotifications(prev => prev.filter(n => n.id !== id));

    // Delete from database
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error('❌ Error deleting notification:', error);
      // Rollback: re-fetch if delete failed
      refreshNotifications();
    } else {
      console.log('✅ Notification deleted successfully');
    }
  }

  async function markAllAsRead() {
    if (!supabase || !user?.id) return;

    console.log('🗑️ Deleting all unread notifications for user:', user.id);

    // Optimistic update: remove all unread from UI
    setNotifications(prev => prev.filter(n => n.dibaca));

    // Delete all unread notifications from database
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .eq("dibaca", false);

    if (error) {
      console.error('❌ Error deleting all notifications:', error);
      // Rollback: re-fetch if delete failed
      refreshNotifications();
    } else {
      console.log('✅ All notifications deleted successfully');
    }
  }

  const unreadCount = notifications.filter(n => !n.dibaca).length;

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  }), [notifications, unreadCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications harus digunakan dalam NotificationProvider");
  }
  return context;
}
