'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface Message {
  id: number;
  role: 'user' | 'bot';
  text: string;
  time: string;
}

const BOT_RESPONSES: Record<string, string> = {
  default: "I'm here to help you with SpinTradeHub! Ask me about products, categories, trading, or how to use the platform.",
  hello: "Hello! 👋 Welcome to SpinTradeHub! I'm your AI assistant. How can I help you today?",
  hi: "Hi there! 😊 I'm your SpinTradeHub assistant. Ask me anything about industrial products, trading, or the platform!",
  bearing: "🔩 Bearings are one of our top categories! We have Deep Groove Ball Bearings, Roller Bearings, Thrust Bearings, and more. Browse the Feed to find suppliers. You can filter by the 'Bearings' category.",
  grease: "🛢️ Industrial grease is available from multiple verified suppliers. Popular brands include SKF, Mobil, Shell, and Castrol. Check the Feed → Grease category.",
  lubricant: "🔧 Lubricants include oils, greases, and specialty fluids. Use the Feed page and select 'Lubricants' category to find suppliers.",
  belt: "⚙️ V-Belts and industrial belts are available from suppliers worldwide. Filter by 'V-Belts' in the Feed section.",
  oil: "🛢️ Industrial oils including hydraulic oil, gear oil, and cutting oil are available. Filter by 'Industrial Oils' in the Feed.",
  machinery: "🏭 Industrial machinery including pumps, motors, compressors, and more are listed by verified suppliers. Check the Machinery category in Feed.",
  sell: "📤 To sell products: Go to Feed → tap the orange '+' button → fill in your product details, add photos and PDF catalogue → tap 'Post Now'!",
  buy: "📥 To buy products: Browse the Feed, use search and category filters to find what you need. Click on a product to send an inquiry to the supplier.",
  post: "📦 To create a post: Tap the orange '+' button on the Feed page. You can add product name, description, price, photo, PDF catalogue, quantity, and location.",
  photo: "📷 You can upload product photos when creating a post. Go to Feed → '+' button → tap the photo upload area to add images (max 5MB).",
  pdf: "📄 PDF catalogues can be uploaded when creating a post. This helps buyers download your full product specs and catalogue!",
  login: "🔐 To login: Go to spintradehub.com/login, enter your email and password. New user? Go to /signup to create an account.",
  signup: "📝 To create an account: Visit spintradehub.com/signup. You need: Full Name, Username, Email, Phone, Country, Role (Supplier/Buyer), and Password.",
  connect: "🤝 To connect with other traders: Go to the Network page, browse suggested users, and tap 'Connect'. You can also search by name or username.",
  message: "💬 To send a message: Go to the Messages page to chat with your connections. You can discuss products, prices, and place orders.",
  dashboard: "📊 Your Dashboard shows your product inventory, active listings, buy requests, and commerce documents (quotations, invoices).",
  profile: "👤 Your Profile shows your account details, role (Supplier/Buyer), region, and quick links. You can edit your info from the Profile page.",
  settings: "⚙️ Settings allows you to manage privacy, notifications, account details, and access help. Go to Settings from the bottom navigation.",
  category: "🏷️ Categories available: Bearings, Grease, V-Belts, Industrial Oils, Lubricants, Machinery, Accessories, Other. Filter products by category in the Feed.",
  price: "💰 Product prices are set by suppliers in USD. You can sort by Price Low to High or High to Low in the Feed. Always negotiate directly with the supplier.",
  inquiry: "📋 To send an inquiry: Click on any product in the Feed to view details, then use the inquiry form to contact the supplier directly.",
  quotation: "📄 Quotations can be created from your Dashboard → Orders tab. This feature is for managing trade documents between buyers and suppliers.",
  firebase: "🔥 SpinTradeHub uses Firebase for secure authentication, real-time database, and file storage. Your data is encrypted and protected.",
  contact: "📞 Contact us at: support@spintradehub.com | Visit the Contact page for more info.",
  support: "🆘 Need help? You can: 1) Chat with me (AI Bot) 2) Visit the FAQ page 3) Email support@spintradehub.com",
  faq: "❓ Check our FAQ page at spintradehub.com/faq for answers to common questions about the platform.",
  about: "ℹ️ SpinTradeHub is a B2B industrial trading platform connecting suppliers, manufacturers, and buyers globally. Visit /about to learn more.",
  feature: "✨ Key features: Product Marketplace, AI Chatbot, Business Networking, Real-time Messaging, Inquiry Management, Commerce Documents, Inventory Tracking, Multi-language Support.",
  language: "🌍 SpinTradeHub supports 40+ languages to serve global traders. The platform auto-detects your browser language.",
  security: "🔐 SpinTradeHub uses Firebase Authentication with encryption. Enable 2-Factor Authentication in Settings for extra security.",
  delivery: "🚚 Delivery is arranged directly between buyers and suppliers. SpinTradeHub facilitates the connection — logistics is negotiated between trading parties.",
  payment: "💳 Payment methods are agreed upon directly between buyers and suppliers. SpinTradeHub facilitates connections but doesn't process payments directly.",
};

function getBotResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const key of Object.keys(BOT_RESPONSES)) {
    if (lower.includes(key)) return BOT_RESPONSES[key];
  }
  return BOT_RESPONSES.default;
}

const QUICK_QUESTIONS = [
  "How to post a product?",
  "How to buy products?",
  "How to connect with suppliers?",
  "What categories are available?",
  "How to send an inquiry?",
  "Contact support",
];

export default function ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'bot',
      text: "👋 Hello! I'm SpinBot, your AI assistant for SpinTradeHub!\n\nI can help you with:\n• 🔍 Finding products\n• 📦 Creating listings\n• 🤝 Connecting with traders\n• ❓ Platform questions\n\nHow can I help you today?",
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

    setTimeout(() => {
      const botMsg: Message = {
        id: Date.now() + 1,
        role: 'bot',
        text: getBotResponse(text),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 400);
  };

  return (
    <div style={{ backgroundColor: '#F5F5F5', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', flexShrink: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/feed" style={{ color: 'white', textDecoration: 'none', fontSize: '20px' }}>←</Link>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#FF8C00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🤖</div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', margin: 0 }}>SpinBot</h1>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>AI Assistant • Online 24/7</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* Quick Questions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {QUICK_QUESTIONS.map((q, idx) => (
            <button key={idx} onClick={() => sendMessage(q)}
              style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #0056D2', color: '#0056D2', borderRadius: '16px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
              {q}
            </button>
          ))}
        </div>

        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
            {msg.role === 'bot' && (
              <div style={{ width: '32px', height: '32px', backgroundColor: '#FF8C00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, marginRight: '8px', alignSelf: 'flex-end' }}>🤖</div>
            )}
            <div style={{ maxWidth: '75%' }}>
              <div style={{
                padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                backgroundColor: msg.role === 'user' ? '#0056D2' : 'white',
                color: msg.role === 'user' ? 'white' : '#333',
                fontSize: '13px', lineHeight: '1.5',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                whiteSpace: 'pre-line'
              }}>
                {msg.text}
              </div>
              <p style={{ fontSize: '10px', color: '#999', margin: '4px 4px 0', textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.time}</p>
            </div>
            {msg.role === 'user' && (
              <div style={{ width: '32px', height: '32px', backgroundColor: '#0056D2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white', flexShrink: 0, marginLeft: '8px', alignSelf: 'flex-end' }}>
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#FF8C00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '6px', height: '6px', backgroundColor: '#999', borderRadius: '50%', animation: `bounce 1s infinite ${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ backgroundColor: 'white', borderTop: '1px solid #E0E0E0', padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask me anything about SpinTradeHub..."
            style={{ flex: 1, padding: '10px 14px', border: '1px solid #E0E0E0', borderRadius: '24px', fontSize: '13px', outline: 'none' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isTyping}
            style={{ width: '44px', height: '44px', backgroundColor: input.trim() ? '#FF8C00' : '#E0E0E0', color: 'white', border: 'none', borderRadius: '50%', cursor: input.trim() ? 'pointer' : 'default', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 200ms' }}>
            ➤
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
