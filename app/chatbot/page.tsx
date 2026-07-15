'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getChatbotResponse } from '@/lib/chatbot-knowledge-base';
import Link from 'next/link';

interface Message {
  id: number;
  role: 'user' | 'bot';
  text: string;
  time: string;
  category?: string;
  confidence?: number;
}


const QUICK_QUESTIONS = [
  "How to post a product?",
  "How to buy products?",
  "Payment & Money inquiries",
  "How to connect with suppliers?",
  "Need support?",
  "About SpinTradeHub",
];

export default function ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'bot',
      text: `🤖 **Welcome to SpinBot - Your 24/7 AI Assistant!**

Hello! I'm **SpinBot**, powered by AI to provide intelligent support 24/7.

I can help you with:
📦 **Buying & Selling** - Post products, find suppliers, create inquiries
🤝 **Networking** - Connect with traders, business relationships
💬 **Account Help** - Sign up, login, profile management
💰 **Orders & Payments** - Payment solutions, quotations, orders
🔐 **Security** - Account protection, privacy, verification
📧 **General Support** - FAQs, platform info, contact details

**Our Commitment:**
✅ 100% Accurate answers about SpinTradeHub
✅ 24/7 Availability - Always online to help
✅ Instant Responses - AI-powered instant answers
✅ Expert Knowledge - Trained on all platform features
✅ Business Support - Call ${'+971541635009'} for money/payment questions

**How to ask:**
• Ask in your own words
• Be specific about what you need
• I'll provide detailed, helpful answers

**Pro Tip:** For urgent financial or payment matters, call **+971541635009** directly!

What would you like to know?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Use intelligent response matching with confidence scoring
    setTimeout(() => {
      const response = getChatbotResponse({
        userMessage: text,
        userId: user?.uid,
        previousMessages: messages.map(m => m.text)
      });

      const botMsg: Message = {
        id: Date.now() + 1,
        role: 'bot',
        text: response.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: response.category,
        confidence: response.confidence
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 400);
  };

  return (
    <div style={{ backgroundColor: '#F5F5F5', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0056D2 0%, #003D9E 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', flexShrink: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/feed" style={{ color: 'white', textDecoration: 'none', fontSize: '20px', cursor: 'pointer' }}>←</Link>
            <div style={{ width: '44px', height: '44px', backgroundColor: '#FF8C00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 2px 8px rgba(255,140,0,0.3)' }}>🤖</div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', margin: 0 }}>SpinBot AI Assistant</h1>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', margin: 0 }}>✅ Online 24/7 • Powered by AI • Instant Answers</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* Quick Questions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
          {QUICK_QUESTIONS.map((q, idx) => (
            <button key={idx} onClick={() => sendMessage(q)}
              style={{ 
                padding: '8px 14px', 
                backgroundColor: 'white', 
                border: '2px solid #0056D2', 
                color: '#0056D2', 
                borderRadius: '20px', 
                fontSize: '12px', 
                cursor: 'pointer', 
                fontWeight: '600',
                transition: 'all 200ms',
                boxShadow: '0 2px 4px rgba(0,86,210,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0056D2';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#0056D2';
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '14px' }}>
            {msg.role === 'bot' && (
              <div style={{ width: '36px', height: '36px', backgroundColor: '#FF8C00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, marginRight: '8px', alignSelf: 'flex-start', boxShadow: '0 2px 6px rgba(255,140,0,0.2)' }}>🤖</div>
            )}
            <div style={{ maxWidth: '70%' }}>
              <div style={{
                padding: '12px 14px', 
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                backgroundColor: msg.role === 'user' ? '#0056D2' : 'white',
                color: msg.role === 'user' ? 'white' : '#333',
                fontSize: '13px', 
                lineHeight: '1.6',
                boxShadow: msg.role === 'user' ? '0 2px 6px rgba(0,86,210,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                whiteSpace: 'pre-line',
                wordWrap: 'break-word'
              }}>
                {/* Format bold text and special formatting */}
                {msg.text.split('\n').map((line, i) => (
                  <div key={i}>
                    {line.split(/(\*\*.*?\*\*)/g).map((part, j) => 
                      part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={j}>{part.slice(2, -2)}</strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '10px', color: '#999', margin: '4px 4px 0', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {msg.time}
                {msg.role === 'bot' && msg.confidence && msg.confidence > 0.8 && (
                  <span style={{ marginLeft: '6px', color: '#4CAF50' }}>✓ Confident match</span>
                )}
              </p>
            </div>
            {msg.role === 'user' && (
              <div style={{ width: '36px', height: '36px', backgroundColor: '#0056D2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white', flexShrink: 0, marginLeft: '8px', alignSelf: 'flex-end', boxShadow: '0 2px 6px rgba(0,86,210,0.2)' }}>
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', backgroundColor: '#FF8C00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 2px 6px rgba(255,140,0,0.2)' }}>🤖</div>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '12px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#999', marginRight: '4px' }}>Thinking...</span>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '6px', height: '6px', backgroundColor: '#FF8C00', borderRadius: '50%', animation: `bounce 1.2s infinite ${i * 0.25}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ backgroundColor: 'white', borderTop: '1px solid #E0E0E0', padding: '14px 16px', flexShrink: 0, boxShadow: '0 -2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask anything... (For money/payment help: +971541635009)"
            style={{ 
              flex: 1, 
              padding: '11px 16px', 
              border: '2px solid #E0E0E0', 
              borderRadius: '28px', 
              fontSize: '13px', 
              outline: 'none',
              transition: 'border-color 200ms',
              fontFamily: 'Inter, sans-serif'
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isTyping}
            style={{ 
              width: '44px', 
              height: '44px', 
              backgroundColor: input.trim() && !isTyping ? '#FF8C00' : '#E0E0E0', 
              color: 'white', 
              border: 'none', 
              borderRadius: '50%', 
              cursor: input.trim() && !isTyping ? 'pointer' : 'default', 
              fontSize: '18px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexShrink: 0, 
              transition: 'background 200ms',
              boxShadow: input.trim() && !isTyping ? '0 2px 8px rgba(255,140,0,0.2)' : 'none'
            }}>
            {isTyping ? '⏳' : '➤'}
          </button>
        </div>
        <p style={{ fontSize: '10px', color: '#999', margin: '8px 0 0', textAlign: 'center' }}>
          💬 AI-Powered 24/7 Support | 📞 For urgent payment/money help: <strong>+971541635009</strong>
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 1; }
          30% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
