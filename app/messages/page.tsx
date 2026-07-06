'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { messageService } from '@/lib/firebase-service';
import Link from 'next/link';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [recipientName, setRecipientName] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchConversations = async () => {
      try {
        setLoading(true);
        // For demo, show sample conversations
        const sampleConvos = [
          { id: '1', name: 'Alice Smith', lastMessage: 'Yes, I can provide a bulk discount.', timestamp: '2:45 PM' },
          { id: '2', name: 'Charlie Brown', lastMessage: 'Great, lets finalize the deal tomorrow.', timestamp: '11:30 AM' },
          { id: '3', name: 'Frank Miller', lastMessage: 'Can you share the spec sheet?', timestamp: 'Yesterday' },
        ];
        setConversations(sampleConvos);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user, authLoading, router]);

  const handleSelectConversation = (convo: any) => {
    setSelectedConversation(convo);
    setRecipientName(convo.name);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      await messageService.sendMessage({
        conversationId: selectedConversation.id,
        senderId: user!.uid,
        senderName: user!.email || 'You',
        text: messageText,
        timestamp: Date.now(),
      });
      setMessageText('');
      // Refetch messages
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (authLoading || loading) {
    return <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '80px' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '100%', padding: '16px' }}>
          <Link href="/feed" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white' }}>
            <span style={{ fontSize: '20px' }}>←</span>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'white' }}>Messages</h1>
          </Link>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ width: '300px', backgroundColor: 'white', borderRight: '1px solid #E0E0E0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #E0E0E0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 }}>Conversations</h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#999', fontSize: '13px' }}>No conversations</div>
            ) : (
              conversations.map((convo) => (
                <div key={convo.id} onClick={() => handleSelectConversation(convo)} style={{ padding: '12px 16px', borderBottom: '1px solid #E0E0E0', cursor: 'pointer', backgroundColor: selectedConversation?.id === convo.id ? '#F0F7FF' : 'white', transition: 'all 200ms' }} onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F5')} onMouseOut={(e) => (e.currentTarget.style.backgroundColor = selectedConversation?.id === convo.id ? '#F0F7FF' : 'white')}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: '0 0 4px 0' }}>{convo.name}</h3>
                  <p style={{ fontSize: '12px', color: '#999', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{convo.lastMessage}</p>
                  <p style={{ fontSize: '11px', color: '#CCC', margin: '4px 0 0 0' }}>{convo.timestamp}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <>
              <div style={{ padding: '16px', borderBottom: '1px solid #E0E0E0', backgroundColor: 'white' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 }}>{selectedConversation.name}</h2>
                <p style={{ fontSize: '12px', color: '#999', margin: '4px 0 0 0' }}>Last message: {selectedConversation.timestamp}</p>
              </div>

              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#FAFAFA' }}>
                <div style={{ backgroundColor: 'white', padding: '12px 16px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <p style={{ color: '#333', fontSize: '13px', margin: 0 }}>{selectedConversation.lastMessage}</p>
                  <p style={{ fontSize: '11px', color: '#999', marginTop: '8px', margin: 0 }}>{selectedConversation.name}</p>
                </div>
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '16px', borderTop: '1px solid #E0E0E0', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type your message..." style={{ flex: 1, padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', outline: 'none' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')} onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} />
                  <button type="submit" style={{ padding: '10px 24px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }} onMouseOver={(e) => (e.currentTarget.style.background = '#E67E00')} onMouseOut={(e) => (e.currentTarget.style.background = '#FF8C00')}>Send</button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px' }}>Select a conversation to start</div>
          )}
        </div>
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
        <Link href="/messages" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>💬</span>
          <span>Messages</span>
        </Link>
        <Link href="/profile" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
