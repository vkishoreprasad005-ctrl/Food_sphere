import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useToast } from './ToastContext.tsx';
import { AppNotification } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';

interface RealtimeContextType {
  notifications: AppNotification[];
  unreadCount: number;
  lastEvent: { type: string; payload: any; tenantId?: string } | null;
  markAsRead: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, business } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any; tenantId?: string } | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const res = await apiRequest<AppNotification[]>('/api/notifications');
    if (res.data) {
      setNotifications(res.data);
    }
  }, [user]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Connect to SSE
  useEffect(() => {
    const es = new EventSource('/api/events');

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === 'CONNECTED') return;

        setLastEvent(event);

        // Check if event is relevant to current session
        const isMyTenant = business && event.tenantId === business.id;
        const isCustomer = user?.role === 'customer';

        if (event.type === 'ORDER_CREATED' && isMyTenant) {
          showToast(`New Order #${event.payload.id} received ($${event.payload.total.toFixed(2)})!`, 'success', 'Kitchen Alert');
          refreshNotifications();
        } else if (event.type === 'RESERVATION_CREATED' && isMyTenant) {
          showToast(`New reservation request from ${event.payload.customerName}!`, 'info', 'Table Booking');
          refreshNotifications();
        } else if (event.type === 'ORDER_UPDATED' && (isMyTenant || isCustomer)) {
          if (isCustomer && event.payload.customerId === user?.id) {
            showToast(`Order #${event.payload.id} status changed to ${event.payload.orderStatus}`, 'info', 'Order Update');
          }
          refreshNotifications();
        } else if (event.type === 'RESERVATION_UPDATED' && isCustomer) {
          if (event.payload.customerId === user?.id) {
            showToast(`Your reservation is now ${event.payload.status}`, 'success', 'Reservation Update');
          }
          refreshNotifications();
        }
      } catch (err) {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // EventSource reconnects automatically
    };

    return () => {
      es.close();
    };
  }, [user, business, showToast, refreshNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <RealtimeContext.Provider
      value={{
        notifications,
        unreadCount,
        lastEvent,
        markAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
