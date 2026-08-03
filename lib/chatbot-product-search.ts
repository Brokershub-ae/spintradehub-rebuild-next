/**
 * SpinBot Product Search
 * Searches real Firestore posts to answer product/supplier/price queries
 */

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Product } from './firebase-service';

// Keywords that indicate user is asking about products/suppliers/prices
const PRODUCT_QUERY_KEYWORDS = [
  'cheapest', 'cheap', 'best rate', 'best price', 'lowest price', 'affordable',
  'distributor', 'supplier', 'seller', 'vendor', 'manufacturer',
  'bearing', 'grease', 'oil', 'motor', 'pump', 'valve', 'pipe', 'bolt', 'gear',
  'buy', 'purchase', 'available', 'stock', 'rate', 'price', 'cost', 'quote',
  'quotation', 'who sells', 'where to buy', 'find', 'looking for',
  'industrial', 'product', 'spare parts', 'machinery',
];

export function isProductQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return PRODUCT_QUERY_KEYWORDS.some(keyword => lower.includes(keyword));
}

export async function searchPostsForQuery(userMessage: string): Promise<Product[]> {
  try {
    // Fetch all posts from Firestore
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const allPosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Product));

    // Extract keywords from user message
    const words = userMessage.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Score each post by relevance
    const scored = allPosts.map(post => {
      const searchText = [
        post.productName || '',
        post.description || '',
        post.category || '',
        post.creatorName || '',
        post.location || '',
      ].join(' ').toLowerCase();

      let score = 0;
      for (const word of words) {
        if (searchText.includes(word)) score += 2;
      }

      // Boost SELL posts (users looking to buy need sellers)
      if (post.postType === 'SELL') score += 1;

      return { post, score };
    });

    // Return top 5 relevant posts
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.post);
  } catch (error) {
    console.error('Error searching posts:', error);
    return [];
  }
}

export function formatProductResults(posts: Product[], userMessage: string): string {
  if (posts.length === 0) {
    return `🔍 **No matching products found yet on SpinTradeHub.**

No suppliers have posted this product yet. Here's what you can do:

📢 **Post a "BUY" Request** — Go to [Create Post](/create-post) and post what you're looking for. Suppliers will contact you directly!

🔔 **Check the Feed** — Visit [Product Feed](/feed) regularly as new products are added daily.

📞 **Contact Support** — Call **+971541635009** and we'll help you find the right supplier.`;
  }

  const lines: string[] = [];
  lines.push(`🔍 **Found ${posts.length} matching result${posts.length > 1 ? 's' : ''} on SpinTradeHub:**\n`);

  posts.forEach((post, i) => {
    const emoji = post.postType === 'SELL' ? '🏭' : '🛒';
    const type = post.postType === 'SELL' ? 'SELLING' : 'BUYING';
    lines.push(`**${i + 1}. ${emoji} ${post.productName}**`);
    lines.push(`   📌 Type: ${type}`);
    if (post.price) lines.push(`   💰 Price: ${post.price}`);
    if (post.quantity && post.unit) lines.push(`   📦 Quantity: ${post.quantity} ${post.unit}`);
    if (post.location) lines.push(`   📍 Location: ${post.location}`);
    lines.push(`   👤 Seller: **${post.creatorName}**`);
    if (post.description) lines.push(`   📝 ${post.description.slice(0, 100)}${post.description.length > 100 ? '...' : ''}`);
    lines.push(`   🔗 [View & Contact Seller](/profile/${post.creatorId})\n`);
  });

  lines.push(`---`);
  lines.push(`💡 **Tip:** Click "View & Contact Seller" to message them directly or send a connection request!`);
  lines.push(`📋 See all products → [Product Feed](/feed)`);

  return lines.join('\n');
}
