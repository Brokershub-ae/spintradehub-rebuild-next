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
- Support: +971541635009

Important rules:
- Always respond in the same language the user writes in
- Be friendly but professional
- If asked about prices, always refer to actual listings on the platform
- Encourage users to post products or connect with sellers
- Keep responses clear and structured with bullet points where helpful
- For payment/money issues, always refer to +971541635009`;

export async function POST(req: NextRequest) {
  try {
    const { message, history, products } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build context with real product data if available
    let productContext = '';
    if (products && products.length > 0) {
      productContext = `\n\nRELEVANT PRODUCTS CURRENTLY LISTED ON SPINTRADEHUB:\n`;
      products.forEach((p: any, i: number) => {
        productContext += `${i + 1}. ${p.productName} | Price: ${p.price || 'Contact seller'} | Seller: ${p.creatorName} | Location: ${p.location || 'Not specified'} | Type: ${p.postType} | Description: ${p.description?.slice(0, 100) || ''} | Profile: /profile/${p.creatorId}\n`;
      });
      productContext += `\nBase your answer on these real listings. Recommend specific sellers with their names and profile links.`;
    }

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
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'AI service temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
