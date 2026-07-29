'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { notificationService, Notification } from '@/lib/firebase-notifications';
import { connectionService } from '@/lib/firebase-service';
import { useToast } from '@/lib/toast-context';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const initializeNotifications = async () => {
      try {
        if (isMounted) setLoading(true);
        const notifs = await notificationService.getAllNotifications(user.uid);
        if (isMounted) {
          setNotifications(notifs);
        }

        // Set up real-time listener
        if (isMounted) {
          unsubscribe = notificationService.listenToNotifications(user.uid, (updatedNotifs) => {
            if (isMounted) {
              setNotifications(updatedNotifs);
            }
          });
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        if (isMounted) setLoading(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeNotifications();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, authLoading, router]);

  const handleConnect = async (newUserId: string, newUserName: string) => {
    if (!user) return;

    try {
      await connectionService.sendConnectionRequest({
        senderId: user.uid,
        senderName: user.displayName || user.email || 'User',
        senderEmail: user.email || '',
        receiverId: newUserId,
        receiverName: newUserName,
        message: `Hi! I'd like to connect with you on SpinTradeHub.`,
        status: 'PENDING',
      } as any);
      addToast({
        type: 'success',
        title: 'Connection Sent',
        message: 'Connection request sent successfully!',
      });
    } catch (error) {
      console.error('Error sending connection request:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to send connection request',
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif' }}>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '80px', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '100%', padding: '16px' }}>
          <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white' }}>
            <span style={{ fontSize: '20px' }}>←</span>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'white' }}>🔔 Notifications</h1>
          </Link>
        </div>
      </header>

      <div style={{ flex: 1, maxWidth: '600px', width: '100%', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: '#999' }}>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>No notifications yet</p>
            <p style={{ fontSize: '13px', margin: 0 }}>You'll get notifications when new users join or when someone connects with you</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.read) handleMarkAsRead(notif.id!);
                if (notif.link) router.push(notif.link);
              }}
              style={{
                backgroundColor: notif.read ? 'white' : '#E3F2FD',
                border: `1px solid ${notif.read ? '#E0E0E0' : '#0056D2'}`,
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 200ms',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
              onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
              onMouseOut={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              {/* Icon based on type */}
              <div style={{ fontSize: '24px', flexShrink: 0 }}>
                {notif.type === 'NEW_USER_JOINED' && '🎉'}
                {notif.type === 'CONNECTION' && '🤝'}
                {notif.type === 'MESSAGE' && '💬'}
                {notif.type === 'ORDER' && '📦'}
                {notif.type === 'REVIEW' && '⭐'}
                {notif.type === 'SYSTEM' && '📢'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: 0 }}>
                    {notif.title}
                  </h3>
                  {!notif.read && (
                    <span style={{ width: '8px', height: '8px', backgroundColor: '#0056D2', borderRadius: '50%', flexShrink: 0, marginTop: '6px' }}></span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#666', margin: '0 0 8px 0' }}>
                  {notif.message}
                </p>

                {/* New User Info Card */}
                {notif.type === 'NEW_USER_JOINED' && notif.newUserId && (
                  <div style={{ backgroundColor: 'white', borderRadius: '6px', padding: '10px', marginBottom: '8px', border: '1px solid #E0E0E0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#333', margin: '0 0 4px 0' }}>
                          {notif.newUserName}
                        </p>
                        <p style={{ fontSize: '11px', color: '#999', margin: '0 0 2px 0' }}>
                          <strong>{notif.newUserRole}</strong> • {notif.newUserRegion}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnect(notif.newUserId!, notif.newUserName!);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#0056D2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#003D99')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0056D2')}
                      >
                        ➕ Connect
                      </button>
                    </div>
                  </div>
                )}

                <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>
                  {new Date(notif.timestamp).toLocaleDateString()} {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(notif.id!);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '0',
                  flexShrink: 0,
                }}
                title="Delete notification"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
