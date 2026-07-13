'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { userService, connectionService } from '@/lib/firebase-service';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { listenToAllUsers, stopListening } from '@/lib/realtime-sync';
import Link from 'next/link';

export default function NetworkPage() {
  const { user, loading: authLoading } = useAuth();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<any[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<any[]>([]);
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
      const filtered = users
        .filter((u) => u.uid !== user.uid) // Exclude current user
        .filter((u) => u.uid !== undefined); // Ensure valid users

      setAllUsers(filtered);
      setDisplayedUsers(filtered);
      setLoading(false);
    });

    // Fetch connection requests once
    const fetchRequests = async () => {
      try {
        const requests = await connectionService.getConnectionRequests(user.uid);
        setConnectionRequests(requests);
      } catch (error) {
        console.error('Error fetching connection requests:', error);
      }
    };

    fetchRequests();

    // Cleanup listener on unmount
    return () => {
      unsubscribeUsers?.();
    };
  }, [user, authLoading, router]);

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
      alert('✓ Connection request sent!');
      // Remove user from display
      setDisplayedUsers(displayedUsers.filter((u) => u.uid !== userId));
      setAllUsers(allUsers.filter((u) => u.uid !== userId));
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('Failed to send connection request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await connectionService.acceptConnectionRequest(requestId);
      setConnectionRequests(connectionRequests.filter((r) => r.id !== requestId));
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setDisplayedUsers(allUsers);
      return;
    }

    try {
      // Search by name or username
      const filtered = allUsers.filter((u) =>
        u.name?.toLowerCase().includes(query.toLowerCase()) ||
        u.username?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase())
      );
      setDisplayedUsers(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  if (authLoading || loading) {
    return <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>Network</h1>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>Connect with professionals</p>
            </div>
            <Link href="/feed" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>Back</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
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
                  placeholder="🔍 Search by name, email..." 
                  value={searchQuery} 
                  onChange={(e) => handleSearch(e.target.value)}
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

            {displayedUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: 'white', borderRadius: '12px' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🔍</p>
                <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
                  {searchQuery ? 'No users found matching your search' : 'No users available'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {displayedUsers.map((u) => (
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
                    <p style={{ fontSize: '11px', color: '#999', margin: '4px 0' }}>📧 {u.email}</p>
                    <button 
                      onClick={() => handleSendConnectionRequest(u.uid, u.name || 'User', u.email || '')} 
                      style={{ width: '100%', padding: '10px 12px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '12px' }} 
                      onMouseOver={(e) => (e.currentTarget.style.background = '#E67E00')} 
                      onMouseOut={(e) => (e.currentTarget.style.background = '#FF8C00')}
                    >
                      🤝 Send Request
                    </button>
                  </div>
                ))}
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
                      <div style={{ display: 'flex', gap: '8px', minWidth: 'fit-content' }}>
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
