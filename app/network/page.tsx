'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { userService, connectionService } from '@/lib/firebase-service';
import Link from 'next/link';

export default function NetworkPage() {
  const { user, loading: authLoading } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
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

    const fetchData = async () => {
      try {
        setLoading(true);
        // For demo, show sample suggested users
        const sampleUsers = [
          { uid: '1', name: 'Alice Smith', username: 'alice_smith', email: 'alice@example.com', role: 'supplier', region: 'UAE' },
          { uid: '2', name: 'Charlie Brown', username: 'charlie_b', email: 'charlie@example.com', role: 'buyer', region: 'India' },
          { uid: '3', name: 'Diana Prince', username: 'diana_p', email: 'diana@example.com', role: 'supplier', region: 'USA' },
          { uid: '4', name: 'Frank Miller', username: 'frank_m', email: 'frank@example.com', role: 'buyer', region: 'UK' },
        ];
        setSuggestedUsers(sampleUsers);

        const requests = await connectionService.getConnectionRequests(user.uid);
        setConnectionRequests(requests);
      } catch (error) {
        console.error('Error fetching network data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router]);

  const handleSendConnectionRequest = async (userId: string, userName: string) => {
    try {
      await connectionService.sendConnectionRequest({
        senderId: user!.uid,
        senderName: user!.email || 'User',
        senderEmail: user!.email || '',
        receiverId: userId,
        receiverName: userName,
        message: 'Hi! Let\'s connect',
        timestamp: Date.now(),
        status: 'PENDING',
      });
      alert('Connection request sent!');
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await connectionService.acceptConnectionRequest(requestId);
      setConnectionRequests(connectionRequests.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error('Error accepting request:', error);
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
    if (!query.trim()) return;
    try {
      const results = await userService.searchUsers(query);
      setSuggestedUsers(results);
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
              <input type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(searchQuery); }} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')} onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
              {suggestedUsers.map((user) => (
                <div key={user.uid} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '16px', textAlign: 'center', transition: 'all 200ms' }} onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)')} onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}>
                  <div style={{ width: '60px', height: '60px', backgroundColor: '#0056D2', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px', fontWeight: 'bold' }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 4px' }}>{user.name}</h3>
                  <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>@{user.username}</p>
                  <p style={{ fontSize: '11px', color: '#0056D2', backgroundColor: 'rgba(0,86,210,0.1)', borderRadius: '6px', padding: '4px 8px', alignSelf: 'center', display: 'inline-block', marginTop: '8px', marginBottom: '8px' }}>{user.role}</p>
                  <p style={{ fontSize: '12px', color: '#666', margin: '8px 0' }}>📍 {user.region}</p>
                  <button onClick={() => handleSendConnectionRequest(user.uid, user.name)} style={{ width: '100%', padding: '10px 12px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '12px' }} onMouseOver={(e) => (e.currentTarget.style.background = '#E67E00')} onMouseOut={(e) => (e.currentTarget.style.background = '#FF8C00')}>
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {connectionRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ color: '#999', fontSize: '14px' }}>No pending requests</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {connectionRequests.map((request) => (
                  <div key={request.id} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 }}>{request.senderName}</h3>
                        <p style={{ fontSize: '12px', color: '#999', margin: '4px 0' }}>{request.senderEmail}</p>
                        <p style={{ fontSize: '13px', color: '#666', margin: '8px 0 0' }}>{request.message}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleAcceptRequest(request.id)} style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }} onMouseOver={(e) => (e.currentTarget.style.background = '#45a049')} onMouseOut={(e) => (e.currentTarget.style.background = '#4CAF50')}>Accept</button>
                        <button onClick={() => handleRejectRequest(request.id)} style={{ padding: '8px 16px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }} onMouseOver={(e) => (e.currentTarget.style.background = '#da190b')} onMouseOut={(e) => (e.currentTarget.style.background = '#F44336')}>Reject</button>
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
