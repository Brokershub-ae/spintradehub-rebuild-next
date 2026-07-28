'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { userService, connectionService } from '@/lib/firebase-service';
import { useToast } from '@/lib/toast-context';
import Link from 'next/link';

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { userId } = useParams();
  const router = useRouter();
  const { addToast } = useToast();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'pending' | 'none'>('none');

  useEffect(() => {
    if (authLoading || !userId) return;

    if (!user) {
      router.push('/login');
      return;
    }

    loadUserProfile();
  }, [user, authLoading, userId, router]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await userService.getUserProfile(userId as string);
      setProfileData(profile);

      // Check connection status
      const allConnections = await connectionService.getUserConnectionRequests(user!.uid);
      const connection = allConnections.find(
        (c) =>
          (c.senderId === user!.uid && c.receiverId === userId as string) ||
          (c.senderId === userId as string && c.receiverId === user!.uid)
      );

      if (connection?.status === 'ACCEPTED') {
        setConnectionStatus('connected');
      } else if (connection?.status === 'PENDING') {
        setConnectionStatus('pending');
      } else {
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load user profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendConnection = async () => {
    if (!profileData) return;

    try {
      await connectionService.sendConnectionRequest({
        senderId: user!.uid,
        senderName: user!.displayName || user!.email || 'User',
        senderEmail: user!.email || '',
        receiverId: userId as string,
        receiverName: profileData.name || 'User',
        message: `Let's connect!`,
        timestamp: Date.now(),
        status: 'PENDING',
      });

      setConnectionStatus('pending');
      addToast({
        type: 'success',
        title: 'Connection Sent',
        message: `Connection request sent to ${profileData.name}`,
      });
    } catch (error) {
      console.error('Error sending connection:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to send connection request',
      });
    }
  };

  const handleMessage = () => {
    router.push(`/messages?user=${userId}`);
  };

  if (authLoading || loading) {
    return (
      <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif' }}>Loading profile...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>User not found</p>
          <Link href="/network" style={{ color: '#0056D2', textDecoration: 'none', fontWeight: '600' }}>
            ← Back to Network
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/network" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white' }}>
            <span style={{ fontSize: '20px' }}>←</span>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'white' }}>👤 Profile</h1>
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '100%', backgroundColor: 'white', marginBottom: '16px' }}>
        {/* Profile Header */}
        <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid #E0E0E0' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#0056D2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold',
              margin: '0 auto 16px',
            }}
          >
            {profileData.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', margin: '0 0 8px 0' }}>
            {profileData.name || 'User'}
          </h2>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 16px 0' }}>
            {profileData.role && profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
            {profileData.region && ` • ${profileData.region}`}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {connectionStatus === 'connected' && (
              <>
                <button
                  onClick={handleMessage}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#FF8C00',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  💬 Message
                </button>
              </>
            )}
            {connectionStatus === 'pending' && (
              <button disabled style={{ padding: '10px 20px', backgroundColor: '#CCC', color: 'white', border: 'none', borderRadius: '4px', cursor: 'not-allowed' }}>
                ⏳ Pending
              </button>
            )}
            {connectionStatus === 'none' && (
              <button
                onClick={handleSendConnection}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0056D2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ➕ Connect
              </button>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>About</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {profileData.email && (
              <div>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Email</p>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#333', margin: '4px 0 0 0' }}>{profileData.email}</p>
              </div>
            )}
            {profileData.phone && (
              <div>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Phone</p>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#333', margin: '4px 0 0 0' }}>{profileData.phone}</p>
              </div>
            )}
            {profileData.region && (
              <div>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Region</p>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#333', margin: '4px 0 0 0' }}>{profileData.region}</p>
              </div>
            )}
            {profileData.role && (
              <div>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Role</p>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#333', margin: '4px 0 0 0' }}>
                  {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
