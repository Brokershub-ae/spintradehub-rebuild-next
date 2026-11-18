'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { messagingService } from '@/lib/firebase-messaging';
import { useToast } from '@/lib/toast-context';
import Link from 'next/link';
import EmojiPicker from 'emoji-picker-react';
import styles from './messages.module.css';

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
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const timestampIntervalRef = useRef<NodeJS.Timeout>();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport || loading || authLoading) return;
    const resize = () => {
      pageRef.current?.style.setProperty('--messages-height', `${viewport.height}px`);
    };
    resize();
    viewport.addEventListener('resize', resize);
    return () => viewport.removeEventListener('resize', resize);
  }, [loading, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const initializeConversations = async () => {
      try {
        // First, load conversations immediately
        if (isMounted) setLoading(true);
        const convs = await messagingService.getConversations(user.uid);
        
        if (isMounted) {
          setConversations(convs);
          if (convs.length > 0 && !userIdParam && window.matchMedia('(min-width: 701px)').matches) {
            selectConversation(convs[0], false);
          }
          setLoading(false);
        }

        // Then set up real-time listener for future updates
        if (isMounted) {
          unsubscribe = messagingService.listenToConversations(user.uid, (updatedConversations) => {
            if (isMounted) {
              setConversations(updatedConversations);
              setIsLive(true);
              setConnectionStatus('connected');
            }
          });
        }
      } catch (error) {
        console.error('Error initializing conversations:', error);
        if (isMounted) {
          setLoading(false);
          setConnectionStatus('error');
        }
      }
    };

    initializeConversations();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [user, authLoading, router]);

  useEffect(() => {
    // If there's a user parameter and conversations are loaded, find and select that conversation
    if (userIdParam && user && !loading && selectedConversation?.otherUserId !== userIdParam) {
      let cancelled = false;
      // First check if conversation already exists
      const targetConv = conversations.find(c => c.senderId === userIdParam || c.otherUserId === userIdParam);
      if (targetConv) {
        selectConversation(targetConv);
      } else {
        // No existing conversation, create one
        messagingService.getOrCreateConversation(user.uid, userIdParam).then(conv => {
          if (!cancelled) selectConversation(conv);
        }).catch(err => {
          console.error('Error creating conversation:', err);
          if (!cancelled) addToast({ type: 'error', title: 'Error', message: 'Unable to open this conversation. Please try again.' });
        });
      }
      return () => { cancelled = true; };
    }
  }, [userIdParam, user, conversations, loading, selectedConversation?.otherUserId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update timestamps every minute for relative time display
  useEffect(() => {
    timestampIntervalRef.current = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 60000); // Update every minute

    return () => {
      if (timestampIntervalRef.current) {
        clearInterval(timestampIntervalRef.current);
      }
    };
  }, []);

  // Fallback polling - refresh messages every 30 seconds if real-time isn't active
  useEffect(() => {
    if (selectedConversation && user) {
      let cancelled = false;
      const refreshMessages = async () => {
        try {
          const freshMessages = await messagingService.getMessages(
            user.uid,
            selectedConversation.otherUserId
          );
          if (cancelled) return;
          setMessages(freshMessages);
          if (!isLive) {
            setIsLive(true);
            setConnectionStatus('reconnected');
          }
        } catch (error) {
          console.warn('Polling update skipped:', error);
          setConnectionStatus('offline');
        }
      };

      pollingIntervalRef.current = setInterval(refreshMessages, 30000); // Poll every 30 seconds

      return () => {
        cancelled = true;
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [selectedConversation, user, isLive]);

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

  const selectConversation = (conv: any, openOnMobile = true) => {
    setSelectedConversation(conv);
    setMobileChatOpen(openOnMobile);
    setShowEmojiPicker(false);
  };

  const handleBackToChats = () => {
    setMobileChatOpen(false);
    setSelectedConversation(null);
    setMessages([]);
    setShowEmojiPicker(false);
    if (userIdParam) router.replace('/messages');
  };

  useEffect(() => {
    if (!selectedConversation || !user) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    const conv = selectedConversation;
    setMessages([]);
    const load = async () => {
      try {
      // Get fresh messages for this conversation
      const msgs = await messagingService.getMessages(user!.uid, conv.otherUserId);
      if (cancelled) return;
      setMessages(msgs);

      // Auto-mark incoming messages as read as soon as the conversation is opened.
      if (msgs.some((msg) => msg.receiverId === user!.uid && !msg.read)) {
        await messagingService.markConversationAsRead(user!.uid, conv.otherUserId);
        const refreshed = await messagingService.getMessages(user!.uid, conv.otherUserId);
        if (cancelled) return;
        setMessages(refreshed);
      }

      // Keep unread messages visible until they are explicitly handled.
      // Set up real-time listener for new messages
      if (cancelled) return;
      unsubscribe = messagingService.listenToMessages(
        user!.uid,
        conv.otherUserId,
        async (updatedMessages) => {
          if (cancelled) return;
          setMessages(updatedMessages);

          if (updatedMessages.some((msg) => msg.receiverId === user!.uid && !msg.read)) {
            try {
              await messagingService.markConversationAsRead(user!.uid, conv.otherUserId);
              const refreshed = await messagingService.getMessages(user!.uid, conv.otherUserId);
              if (!cancelled) setMessages(refreshed);
            } catch (error) {
              console.error('Error marking incoming messages as read:', error);
              if (!cancelled) addToast({ type: 'error', title: 'Error', message: 'Unable to mark incoming messages as read.' });
            }
          }
        }
      );

    } catch (error) {
      if (cancelled) return;
      console.error('Error loading messages:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load messages',
      });
    }
    };
    load();
    return () => { cancelled = true; unsubscribe?.(); };
  }, [selectedConversation?.otherUserId, user?.uid]);

  const handleAttachmentSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      setUploading(true);
      const newAttachments = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Determine attachment type
        let attachmentType: 'image' | 'pdf' | 'document' = 'document';
        if (file.type.startsWith('image/')) {
          attachmentType = 'image';
        } else if (file.type === 'application/pdf') {
          attachmentType = 'pdf';
        }

        // Upload file
        const { url, name } = await messagingService.uploadAttachment(
          user!.uid,
          file,
          attachmentType
        );

        newAttachments.push({
          type: attachmentType,
          fileName: name,
          fileUrl: url,
          size: file.size,
          uploadedAt: Date.now(),
        });
      }

      setAttachments([...attachments, ...newAttachments]);
      addToast({
        type: 'success',
        title: 'Files Uploaded',
        message: `${newAttachments.length} file(s) ready to send`,
      });
    } catch (error) {
      console.error('Error uploading attachment:', error);
      addToast({
        type: 'error',
        title: 'Upload Error',
        message: 'Failed to upload file',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emojiData: any) => {
    setMessageText((prevText) => prevText + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const handleSendMessage = async () => {
    if ((!messageText.trim() && attachments.length === 0) || !selectedConversation) {
      addToast({
        type: 'warning',
        title: 'Warning',
        message: 'Please select a conversation and type a message',
      });
      return;
    }

    try {
      setUploading(true);
      const sentMsg = await messagingService.sendMessage(
        user!.uid,
        user!.displayName || user!.email || 'User',
        selectedConversation.otherUserId,
        selectedConversation.otherUserName,
        messageText,
        attachments.length > 0 ? attachments : undefined
      );

      setMessageText('');
      setAttachments([]);

      // Update selected conversation with latest message immediately
      const lastMsg = messageText || `📎 ${attachments.length} attachment(s)`;
      const updatedConv = {
        ...selectedConversation,
        lastMessage: lastMsg,
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
    } finally {
      setUploading(false);
    }
  };

  const handleMarkCurrentConversationAsRead = async () => {
    if (!selectedConversation || !user?.uid) return;

    try {
      await messagingService.markConversationAsRead(user.uid, selectedConversation.otherUserId);

      setConversations((prev) =>
        prev.map((convo) =>
          convo.id === selectedConversation.id ? { ...convo, unreadCount: 0 } : convo
        )
      );

      setSelectedConversation((prev: any) =>
        prev ? { ...prev, unreadCount: 0 } : prev
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Unable to mark the conversation as read.',
      });
    }
  };

  // Format timestamp as relative time
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  if (authLoading || loading) {
    return (
      <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif' }}>Loading messages...</p>
      </div>
    );
  }

  return (
    <div ref={pageRef} className={`${styles.page} ${mobileChatOpen ? styles.chatOpen : ''}`}>
      <header className={styles.siteHeader} style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', zIndex: 10 }}>
        <div style={{ maxWidth: '100%', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white' }}>
            <span style={{ fontSize: '20px' }}>←</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img className={styles.logo} src="/logo_latest.png" alt="SpinTradeHub logo" />
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'white' }}>💬 Messages</h1>
            </div>
          </Link>
          
        </div>
      </header>

      <div className={styles.workspace}>
        <div className={styles.sidebar}>
          <div style={{ padding: '16px', borderBottom: '1px solid #E0E0E0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 }}>Conversations</h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#999', fontSize: '13px' }}>No conversations yet</div>
            ) : (
              conversations.map((convo) => (
                <button
                  type="button"
                  aria-pressed={selectedConversation?.id === convo.id}
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
                    width: '100%',
                    textAlign: 'left',
                    borderTop: 0,
                    borderLeft: 0,
                    borderRight: 0,
                    fontFamily: 'inherit',
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
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {convo.otherUserName}
                      </h3>
                      <span style={{ fontSize: '11px', color: '#999', flexShrink: 0 }}>
                        {formatRelativeTime(convo.lastMessageTime)}
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
                </button>
              ))
            )}
          </div>
        </div>

        <div className={styles.chatPane}>
          {selectedConversation ? (
            <>
              <div className={styles.chatHeader}>
                <button type="button" className={styles.backButton} onClick={handleBackToChats} disabled={uploading} aria-label="Back to conversations">←</button>
                <h2 className={styles.contactName}>
                  {selectedConversation.otherUserName}
                </h2>
                <div className={styles.chatActions}>
                  {selectedConversation.unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkCurrentConversationAsRead}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#FF8C00',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      ✓ Mark as read
                    </button>
                  )}
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
              </div>

              <div className={styles.messageList} key={updateTrigger} role="log" aria-label="Messages">
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={styles.message}
                      style={{
                        alignSelf: msg.senderId === user?.uid ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          backgroundColor: msg.senderId === user?.uid ? '#0056D2' : 'white',
                          color: msg.senderId === user?.uid ? 'white' : '#333',
                          fontSize: '13px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                      >
                        {msg.productContext && (
                          <div
                            style={{
                              marginBottom: msg.text ? '10px' : 0,
                              padding: '10px 12px',
                              borderRadius: '8px',
                              backgroundColor: msg.senderId === user?.uid ? 'rgba(255,255,255,0.16)' : '#F0F7FF',
                              border: `1px solid ${msg.senderId === user?.uid ? 'rgba(255,255,255,0.22)' : '#D7E9FF'}`,
                            }}
                          >
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.8, marginBottom: '6px' }}>
                              Shared post
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                              {msg.productContext.productName || 'Untitled post'}
                            </div>
                            {msg.productContext.description && (
                              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '6px', whiteSpace: 'pre-wrap' }}>
                                {msg.productContext.description}
                              </div>
                            )}
                            <div style={{ fontSize: '12px', opacity: 0.85, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {msg.productContext.category && <span>Category: {msg.productContext.category}</span>}
                              {msg.productContext.sellerName && <span>Seller: {msg.productContext.sellerName}</span>}
                            </div>
                            {msg.productContext.postUrl && (
                              <Link
                                href={msg.productContext.postUrl}
                                style={{
                                  display: 'inline-block',
                                  marginTop: '8px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: msg.senderId === user?.uid ? 'white' : '#0056D2',
                                  textDecoration: 'underline',
                                }}
                              >
                                Open post
                              </Link>
                            )}
                          </div>
                        )}

                        {msg.text && <p style={{ margin: 0, wordWrap: 'break-word' }}>{msg.text}</p>}

                        {/* Display Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div style={{ marginTop: msg.text ? '8px' : 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {msg.attachments.map((att: any, idx: number) => (
                              <a
                                key={idx}
                                href={att.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 10px',
                                  backgroundColor: msg.senderId === user?.uid ? 'rgba(255,255,255,0.2)' : '#E3F2FD',
                                  borderRadius: '4px',
                                  textDecoration: 'none',
                                  color: msg.senderId === user?.uid ? 'white' : '#0056D2',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  maxWidth: '100%',
                                  transition: 'all 200ms',
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor = msg.senderId === user?.uid ? 'rgba(255,255,255,0.3)' : '#BBE1FF';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = msg.senderId === user?.uid ? 'rgba(255,255,255,0.2)' : '#E3F2FD';
                                }}
                              >
                                <span>
                                  {att.type === 'image' ? '🖼️' : att.type === 'pdf' ? '📄' : '📋'}
                                </span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {att.fileName}
                                </span>
                              </a>
                            ))}
                          </div>
                        )}

                        <p style={{ margin: msg.text || (msg.attachments && msg.attachments.length > 0) ? '4px 0 0 0' : 0, fontSize: '11px', opacity: 0.7 }}>
                          {formatRelativeTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className={styles.composer}
              >
                {/* Attachments Display */}
                {attachments.length > 0 && (
                  <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#E3F2FD',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#333',
                        }}
                      >
                        <span>
                          {att.type === 'image' ? '🖼️' : att.type === 'pdf' ? '📄' : '📋'}
                          {' ' + att.fileName.substring(0, 15)}
                          {att.fileName.length > 15 ? '...' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0056D2',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: 0,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Area */}
                <div className={styles.inputRow}>
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleAttachmentSelect}
                    style={{ display: 'none' }}
                  />

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: uploading ? '#CCC' : '#E0E0E0',
                      color: '#333',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '40px',
                    }}
                    title="Attach files (images, PDF)"
                    aria-label="Attach files"
                  >
                    📎
                  </button>

                  {/* Emoji Button */}
                  <div className={styles.emojiControl}>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      disabled={uploading}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: showEmojiPicker ? '#0056D2' : '#E0E0E0',
                        color: showEmojiPicker ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '40px',
                        transition: 'all 200ms',
                      }}
                      title="Add emoji"
                      aria-label="Add emoji"
                    >
                      😊
                    </button>

                    {/* Emoji Picker Dropdown */}
                    {showEmojiPicker && (
                      <div
                        ref={emojiPickerRef}
                        className={styles.emojiPopover}
                        style={{
                          marginBottom: '8px',
                          zIndex: 1000,
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                      >
                        <EmojiPicker
                          onEmojiClick={handleEmojiSelect}
                          height={300}
                          width="100%"
                          lazyLoadEmojis={true}
                        />
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <input
                    type="text"
                    aria-label="Message"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    disabled={uploading}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '10px 12px',
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      backgroundColor: uploading ? '#F5F5F5' : 'white',
                      color: uploading ? '#CCC' : '#333',
                    }}
                    onFocus={(e) => !uploading && (e.currentTarget.style.borderColor = '#0056D2')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    className={styles.sendButton}
                    aria-label={uploading ? 'Sending message' : 'Send message'}
                    disabled={uploading}
                    style={{
                      backgroundColor: uploading ? '#CCC' : '#FF8C00',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                    }}
                    onMouseOver={(e) => !uploading && (e.currentTarget.style.background = '#E67E00')}
                    onMouseOut={(e) => !uploading && (e.currentTarget.style.background = '#FF8C00')}
                  >
                    {uploading ? '…' : '➤'}
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

      <nav className={styles.navigation}>
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
        <Link href="/network" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
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
