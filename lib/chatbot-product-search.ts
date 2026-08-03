/**
 * SpinBot Product Search
 * Searches real Firestore posts to answer product/supplier/price queries
 */

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Product } from './firebase-service';

// Only match when user is clearly asking about finding/buying a specific product or supplier
const PRODUCT_QUERY_PATTERNS = [
  /who sells/i,
  /where (to buy|can i (buy|find|get))/i,
  /find (me |a |the )?(supplier|seller|distributor|vendor|manufacturer)/i,
  /best (supplier|seller|rate|price|deal) (for|on)/i,
  /cheapest (supplier|seller|price|rate|bearing|grease|oil|pump|valve|motor|belt|gear)/i,
  /lowest price (for|on)/i,
  /(bearing|grease|lubricant|v.belt|engine oil|motor oil|hydraulic oil|pump|valve|spare part|machinery) (supplier|seller|distributor|available|price|rate|cost)/i,
  /looking for (a |the )?(supplier|seller|distributor|bearing|grease|oil|pump)/i,
  /need (a |to buy |to find )?(supplier|bearing|grease|oil|pump|valve|motor|belt)/i,
  /i want to buy/i,
  /show me (products|suppliers|sellers)/i,
];

export function isProductQuery(message: string): boolean {
  return PRODUCT_QUERY_PATTERNS.some(pattern => pattern.test(message));
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
        if (searchText.includes(word)) score += 3;
      }

      // Boost SELL posts
      if (post.postType === 'SELL') score += 1;

      return { post, score };
    });

    // Only return posts with a strong match (score >= 3 means at least one real keyword matched)
    const results = scored
      .filter(s => s.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.post);

    return results;
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
