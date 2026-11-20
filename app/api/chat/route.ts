import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are SpinBot, the intelligent AI assistant for SpinTradeHub — a global B2B industrial trading platform at www.spintradehub.com.

Your role:
- Help buyers find the best suppliers and products at competitive prices
- Help suppliers get more buyers and grow their business
- Answer questions about the platform features
- Provide business advice for industrial trading
- Be concise, helpful, and professional

Platform features you know about:
- Product listings with photos and pricing (bearings, grease, oils, pumps, valves, motors, spare parts, machinery, etc.)
- Real-time messaging with file sharing (quotations, invoices, bills)
- Connection network (buyers connect with suppliers directly)
- Seller dashboard with analytics
- Wishlist and order management
- Reviews and ratings system
- Notifications when new buyers/suppliers join
- AI chatbot (you!)
- Android app available
- 100% FREE — no commission, no hidden charges
- Support: info@spintradehub.com or Customercare@spintradehub.com

Important rules:
- Always respond in the same language the user writes in
- Be friendly but professional
- If asked about prices, always refer to actual listings on the platform
- Encourage users to post products or connect with sellers
- Keep responses clear and structured with bullet points where helpful
- For any other inquiries, refer to info@spintradehub.com or Customercare@spintradehub.com`;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'ai-not-configured' }, { status: 503 });
    }
    const { message, history, products } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Build context with real product data if available
    let productContext = '';
    if (products && products.length > 0) {
      productContext = `\n\nRELEVANT PRODUCTS CURRENTLY LISTED ON SPINTRADEHUB:\n`;
      products.forEach((p: any, i: number) => {
        productContext += `${i + 1}. ${p.productName} | Price: ${p.price || 'Contact seller'} | Seller: ${p.creatorName} | Location: ${p.location || 'Not specified'} | Type: ${p.postType} | Description: ${p.description?.slice(0, 100) || ''} | Profile: /profile/${p.creatorId}\n`;
      });
      productContext += `\nBase your answer on these real listings. Recommend specific sellers with their names and profile links.`;
    }

    // Prefer Groq (free tier) when configured
    if (process.env.GROQ_API_KEY) {
      const groqMessages = [
        { role: 'system', content: SYSTEM_PROMPT + productContext },
        ...(history || []).map((msg: any) => ({
          role: msg.role === 'bot' ? 'assistant' : 'user',
          content: String(msg.text || '').slice(0, 4000),
        })),
        { role: 'user', content: String(message).slice(0, 4000) },
      ];
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: groqMessages,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });
      if (!groqRes.ok) {
        console.error('Groq API error:', groqRes.status, await groqRes.text());
        return NextResponse.json({ error: 'AI service temporarily unavailable. Please try again.' }, { status: 502 });
      }
      const groqData = await groqRes.json();
      const groqText = groqData?.choices?.[0]?.message?.content;
      if (typeof groqText !== 'string' || !groqText.trim()) {
        return NextResponse.json({ error: 'AI service temporarily unavailable. Please try again.' }, { status: 502 });
      }
      return NextResponse.json({ text: groqText.trim() });
    }

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });

    // Build conversation history for Gemini
    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'bot' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT + productContext }],
        },
        {
          role: 'model',
          parts: [{ text: "Understood! I'm SpinBot, ready to help users of SpinTradeHub with intelligent, accurate assistance." }],
        },
        ...chatHistory,
      ],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Gemini API error:', error?.message || error);
    const msg = error?.message || '';
    if (msg.includes('API_KEY') || msg.includes('api key') || msg.includes('INVALID')) {
      return NextResponse.json({ error: '❌ Invalid Gemini API key. Please check Vercel environment variables.' }, { status: 500 });
    }
    if (msg.includes('quota') || msg.includes('QUOTA')) {
      return NextResponse.json({ error: '⚠️ Gemini free quota exceeded. Try again later.' }, { status: 500 });
    }
    return NextResponse.json(
      { error: 'AI service temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
