'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { connectionService, type User } from '@/lib/firebase-service';
import { listenToAllUsers } from '@/lib/realtime-sync';
import { compareUserRatings, reviewService } from '@/lib/firebase-reviews';
import { notificationService } from '@/lib/firebase-notifications';
import Link from 'next/link';

export default function NetworkPage() {
  const { user, loading: authLoading } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [ratedUsers, setRatedUsers] = useState<(User & { avgRating: number; reviewCount: number })[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [ratingsError, setRatingsError] = useState(false);
  const [connectionRequests, setConnectionRequests] = useState<any[]>([]);
  const [allUserConnections, setAllUserConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);

    // Real-time listener for all users
    const unsubscribeUsers = listenToAllUsers((users) => {
      setAllUsers(users);
      setLoading(false);
    });

    // Fetch all connection activity for this user once
    const fetchConnections = async () => {
      try {
        const allConnections = await connectionService.getUserConnectionRequests(user.uid);
        const activeConnections = allConnections.filter(
          (c) => ['PENDING', 'ACCEPTED'].includes(c.status) && (c.senderId === user.uid || c.receiverId === user.uid)
        );
        setAllUserConnections(activeConnections);
        setConnectionRequests(
          allConnections.filter((c) => c.receiverId === user.uid && c.status === 'PENDING')
        );
      } catch (error) {
        console.error('Error fetching connection requests:', error);
      }
    };

    fetchConnections();

    // Cleanup listener on unmount
    return () => {
      unsubscribeUsers?.();
    };
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const filtered = allUsers
      .filter((u) => u.uid !== user.uid)
      .filter((u) => u.uid !== undefined);

    const loadRatings = async () => {
      setLoadingRatings(true);
      setRatingsError(false);
      try {
        const ratings = await reviewService.getUserRatingSummaries();
        const enriched = filtered.map((profile) => ({
          ...profile,
          avgRating: ratings.get(profile.uid)?.avg ?? 0,
          reviewCount: ratings.get(profile.uid)?.count ?? 0,
        }));
        enriched.sort(compareUserRatings);
        if (!cancelled) setRatedUsers(enriched);
      } catch (error) {
        console.error('Error loading network ratings:', error);
        if (!cancelled) setRatingsError(true);
      } finally {
        if (!cancelled) setLoadingRatings(false);
      }
    };

    loadRatings();
    return () => { cancelled = true; };
  }, [allUsers, user]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const displayedUsers = ratedUsers.filter((profile) =>
    [profile.name, profile.username, profile.email, profile.uid]
      .some((value) => value?.toLowerCase().includes(normalizedSearch))
  );

  const handleSendConnectionRequest = async (userId: string, userName: string, userEmail: string) => {
    try {
      await connectionService.sendConnectionRequest({
        senderId: user!.uid,
        senderName: user!.displayName || user!.email || 'User',
        senderEmail: user!.email || '',
        receiverId: userId,
        receiverName: userName,
        message: `Hi ${userName}! I'd like to connect with you for trading opportunities.`,
        timestamp: Date.now(),
        status: 'PENDING',
      });

      await notificationService.createNotification(
        userId,
        'CONNECTION',
        '🤝 New connection request',
        `${user!.displayName || user!.email || 'Someone'} sent you a connection request.`,
        '/network'
      );

      alert('✓ Connection request sent!');
      // Remove user from display
      setRatedUsers((users) => users.filter((u) => u.uid !== userId));
      setAllUsers((users) => users.filter((u) => u.uid !== userId));
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('Failed to send connection request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const request = connectionRequests.find(r => r.id === requestId);
      await connectionService.acceptConnectionRequest(requestId);
      setConnectionRequests(connectionRequests.filter((r) => r.id !== requestId));
      
      if (request) {
        await notificationService.createNotification(
          request.senderId,
          'CONNECTION',
          '🤝 Connection accepted',
          `${user!.displayName || user!.email || 'Someone'} accepted your connection request.`,
          `/profile/${user!.uid}`
        );
      }
      
      alert('✓ Connection accepted!');
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept connection');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await connectionService.rejectConnectionRequest(requestId);
      setConnectionRequests(connectionRequests.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (authLoading || loading) {
    return <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/logo_latest.png" alt="SpinTradeHub logo" style={{ width: '180px', height: '80px', objectFit: 'contain', display: 'block' }} />
            </div>
            <Link href="/feed" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>Back</Link>
          </div>
        </div>
      </header>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', backgroundColor: 'white', borderRadius: '8px', padding: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {['discover', 'requests'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '12px 16px', backgroundColor: activeTab === tab ? '#0056D2' : 'white', color: activeTab === tab ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 200ms' }}>
              {tab === 'discover' ? 'Discover' : `Requests (${connectionRequests.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'discover' ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="🔍 Search by name, username, email or user ID..."
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} 
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')} 
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} 
                />
              </div>
              {searchQuery && (
                <p style={{ fontSize: '12px', color: '#999', margin: '8px 0 0 0' }}>
                  Found {displayedUsers.length} user{displayedUsers.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {loadingRatings ? (
              <p role="status">Loading user ratings...</p>
            ) : ratingsError ? (
              <p role="alert" style={{ color: '#dc2626' }}>Unable to load user ratings. Please refresh to try again.</p>
            ) : displayedUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: 'white', borderRadius: '12px' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🔍</p>
                <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
                  {searchQuery ? 'No users found matching your search' : 'No users available'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {displayedUsers.map((u) => {
                  const existingConnection = allUserConnections.find(
                    (c) =>
                      (c.senderId === user?.uid && c.receiverId === u.uid) ||
                      (c.senderId === u.uid && c.receiverId === user?.uid)
                  );
                  const connectionState = existingConnection?.status === 'ACCEPTED' ? 'connected' : existingConnection?.status === 'PENDING' ? 'pending' : 'none';

                  return (
                    <div key={u.uid} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '16px', textAlign: 'center', transition: 'all 200ms' }} onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)')} onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}>
                      <div style={{ width: '60px', height: '60px', backgroundColor: '#0056D2', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px', fontWeight: 'bold' }}>
                        {u.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 4px' }}>{u.name || 'Unknown User'}</h3>
                      <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>@{u.username || u.email?.split('@')[0] || 'user'}</p>
                      <p style={{ fontSize: '11px', color: '#0056D2', backgroundColor: 'rgba(0,86,210,0.1)', borderRadius: '6px', padding: '4px 8px', alignSelf: 'center', display: 'inline-block', marginTop: '8px', marginBottom: '8px' }}>
                        {u.role === 'supplier' ? '🏭 Seller' : '👤 Buyer'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#666', margin: '8px 0' }}>📍 {u.region || 'N/A'}</p>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#FFB400', marginTop: '6px' }}>
                        <span>⭐</span>
                        <span>{u.reviewCount > 0 ? u.avgRating.toFixed(1) : 'No reviews'}</span>
                        <span style={{ color: '#999' }}>({u.reviewCount || 0} reviews)</span>
                      </div>
                      {Number(u.avgRating || 0) >= 4.5 && (
                        <div style={{ display: 'inline-block', marginTop: '8px', backgroundColor: '#E8F7EE', color: '#0E8A5B', borderRadius: '999px', padding: '4px 8px', fontSize: '10px', fontWeight: '700' }}>
                          Top Rated
                        </div>
                      )}
                      <p style={{ fontSize: '11px', color: '#999', margin: '8px 0 0' }}>📧 {u.email}</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <Link
                          href={`/profile/${u.uid}`}
                          style={{ flex: 1, padding: '10px 12px', backgroundColor: 'white', color: '#0056D2', border: '1px solid #0056D2', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}
                        >
                          👤 View Profile
                        </Link>
                        {connectionState === 'connected' ? (
                          <Link
                            href={`/messages?user=${u.uid}`}
                            style={{ flex: 1, padding: '10px 12px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}
                          >
                            💬 Message
                          </Link>
                        ) : connectionState === 'pending' ? (
                          <button
                            disabled
                            style={{ flex: 1, padding: '10px 12px', backgroundColor: '#E5E7EB', color: '#6B7280', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'not-allowed' }}
                          >
                            ⏳ Pending
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleSendConnectionRequest(u.uid, u.name || 'User', u.email || '')} 
                            style={{ flex: 1, padding: '10px 12px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }} 
                            onMouseOver={(e) => (e.currentTarget.style.background = '#E67E00')} 
                            onMouseOut={(e) => (e.currentTarget.style.background = '#FF8C00')}
                          >
                            🤝 Send Request
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {connectionRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: 'white', borderRadius: '12px' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📨</p>
                <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>No pending connection requests</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {connectionRequests.map((request) => (
                  <div key={request.id} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <div style={{ width: '40px', height: '40px', backgroundColor: '#0056D2', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                            {request.senderName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 }}>{request.senderName || 'Unknown'}</h3>
                            <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0 0' }}>{request.senderEmail}</p>
                          </div>
                        </div>
                        <p style={{ fontSize: '13px', color: '#666', margin: '8px 0 0', fontStyle: 'italic' }}>"{request.message}"</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', minWidth: 'fit-content', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Link
                          href={`/profile/${request.senderId}`}
                          style={{ padding: '8px 16px', backgroundColor: 'white', color: '#0056D2', border: '1px solid #0056D2', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap', textAlign: 'center' }}
                        >
                          👤 View Profile
                        </Link>
                        <button 
                          onClick={() => handleAcceptRequest(request.id)} 
                          style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }} 
                          onMouseOver={(e) => (e.currentTarget.style.background = '#45a049')} 
                          onMouseOut={(e) => (e.currentTarget.style.background = '#4CAF50')}
                        >
                          ✓ Accept
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(request.id)} 
                          style={{ padding: '8px 16px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }} 
                          onMouseOver={(e) => (e.currentTarget.style.background = '#da190b')} 
                          onMouseOut={(e) => (e.currentTarget.style.background = '#F44336')}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link href="/feed" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📦</span>
          <span>Feed</span>
        </Link>
        <Link href="/messages" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>💬</span>
          <span>Messages</span>
        </Link>
        <Link href="/network" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🤝</span>
          <span>Network</span>
        </Link>
        <Link href="/profile" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
