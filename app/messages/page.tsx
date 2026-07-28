'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { messagingService } from '@/lib/firebase-messaging';
import { useToast } from '@/lib/toast-context';
import Link from 'next/link';

function MessagesContent() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('user');
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    loadConversations();

    // Set up real-time listener for conversations
    const unsubscribe = messagingService.listenToConversations(user.uid, (updatedConversations) => {
      setConversations(updatedConversations);
    });

    return () => unsubscribe?.();
  }, [user, authLoading, router]);

  useEffect(() => {
    // If there's a user parameter and conversations are loaded, find and select that conversation
    if (userIdParam && user) {
      // First check if conversation already exists
      const targetConv = conversations.find(c => c.senderId === userIdParam || c.otherUserId === userIdParam);
      if (targetConv) {
        selectConversation(targetConv);
      } else {
        // No existing conversation, create one
        messagingService.getOrCreateConversation(user.uid, userIdParam).then(conv => {
          selectConversation(conv);
        }).catch(err => {
          console.error('Error creating conversation:', err);
        });
      }
    }
  }, [userIdParam, user, conversations]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convs = await messagingService.getConversations(user!.uid);
      setConversations(convs);
      if (convs.length > 0) {
        selectConversation(convs[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load conversations',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: any) => {
    setSelectedConversation(conv);
    try {
      // Get fresh messages for this conversation
      const msgs = await messagingService.getMessages(user!.uid, conv.otherUserId);
      setMessages(msgs);

      // Set up real-time listener for new messages
      const unsubscribe = messagingService.listenToMessages(
        user!.uid,
        conv.otherUserId,
        (updatedMessages) => {
          setMessages(updatedMessages);
        }
      );

      return () => unsubscribe?.();
    } catch (error) {
      console.error('Error loading messages:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load messages',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) {
      addToast({
        type: 'warning',
        title: 'Warning',
        message: 'Please select a conversation and type a message',
      });
      return;
    }

    try {
      const sentMsg = await messagingService.sendMessage(
        user!.uid,
        user!.displayName || user!.email || 'User',
        selectedConversation.otherUserId,
        selectedConversation.otherUserName,
        messageText
      );

      setMessageText('');

      // Update selected conversation with latest message immediately
      const updatedConv = {
        ...selectedConversation,
        lastMessage: messageText,
        lastMessageTime: sentMsg.timestamp,
      };
      setSelectedConversation(updatedConv);

      // Update or add conversation to list
      setConversations((prevConvs) => {
        const convExists = prevConvs.find((c) => c.id === selectedConversation.id);
        if (convExists) {
          // Update existing conversation and move to top
          const updated = prevConvs.map((c) =>
            c.id === selectedConversation.id ? updatedConv : c
          );
          return updated.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        } else {
          // Add new conversation to list
          return [updatedConv, ...prevConvs].sort(
            (a, b) => b.lastMessageTime - a.lastMessageTime
          );
        }
      });

      // Refresh messages
      const msgs = await messagingService.getMessages(user!.uid, selectedConversation.otherUserId);
      setMessages(msgs);

      addToast({
        type: 'success',
        title: 'Message Sent',
        message: `Message sent to ${selectedConversation.otherUserName}`,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to send message. Please try again.',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif' }}>Loading messages...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '80px', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '100%', padding: '16px' }}>
          <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white' }}>
            <span style={{ fontSize: '20px' }}>←</span>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'white' }}>💬 Messages</h1>
          </Link>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ width: 'min(300px, 30%)', backgroundColor: 'white', borderRight: '1px solid #E0E0E0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #E0E0E0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 }}>Conversations</h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#999', fontSize: '13px' }}>No conversations yet</div>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.id}
                  onClick={() => selectConversation(convo)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #E0E0E0',
                    cursor: 'pointer',
                    backgroundColor: selectedConversation?.id === convo.id ? '#F0F7FF' : 'white',
                    transition: 'all 200ms',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F5')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = selectedConversation?.id === convo.id ? '#F0F7FF' : 'white')}
                >
                  {/* User Avatar Circle */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#0056D2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  >
                    {convo.otherUserName?.charAt(0).toUpperCase() || '?'}
                  </div>

                  {/* Conversation Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: 0 }}>
                        {convo.otherUserName}
                      </h3>
                      <span style={{ fontSize: '11px', color: '#999', flexShrink: 0 }}>
                        {new Date(convo.lastMessageTime).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#999', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {convo.lastMessage || '(no messages yet)'}
                    </p>
                    {convo.unreadCount > 0 && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          padding: '2px 8px',
                          backgroundColor: '#FF8C00',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                        }}
                      >
                        {convo.unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <>
              <div style={{ padding: '16px', borderBottom: '1px solid #E0E0E0', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 }}>
                  {selectedConversation.otherUserName}
                </h2>
                <Link
                  href={`/profile/${selectedConversation.otherUserId}`}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#0056D2',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  👤 View Profile
                </Link>
              </div>

              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: msg.senderId === user?.uid ? 'flex-end' : 'flex-start',
                        maxWidth: '60%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: msg.senderId === user?.uid ? '#0056D2' : 'white',
                        color: msg.senderId === user?.uid ? 'white' : '#333',
                        fontSize: '13px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}
                    >
                      <p style={{ margin: 0, wordWrap: 'break-word' }}>{msg.text}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.7 }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                style={{ padding: '16px', borderTop: '1px solid #E0E0E0', backgroundColor: 'white' }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#FF8C00',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#E67E00')}
                    onMouseOut={(e) => (e.currentTarget.style.background = '#FF8C00')}
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px' }}>
              Select a conversation to start messaging
            </div>
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

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>💬</p>
            <p style={{ fontSize: '14px', color: '#999' }}>Loading messages...</p>
          </div>
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
