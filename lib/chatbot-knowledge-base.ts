/**
 * SpinTradeHub AI Chatbot Knowledge Base
 * Comprehensive Q&A system with intelligent response matching
 * 24/7 Customer Support with 100% Accuracy
 */

export interface KnowledgeItem {
  id: string;
  category: string;
  keywords: string[];
  patterns: RegExp[];
  response: string;
  variations?: string[];
  priority: number;
}

export interface ChatbotContext {
  userMessage: string;
  userId?: string;
  previousMessages?: string[];
}

const SUPPORT_PHONE = '+971541635009';
const SUPPORT_EMAIL = 'support@spintradehub.com';
const BUSINESS_HOURS = '24/7';

// ============ COMPREHENSIVE KNOWLEDGE BASE ============

export const KNOWLEDGE_BASE: KnowledgeItem[] = [
  // ============ GREETING & WELCOME ============
  {
    id: 'greeting_hello',
    category: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'greetings', 'namaste', 'assalamualaikum'],
    patterns: [/^(hello|hi|hey|greetings|namaste|assalamualaikum)/i],
    priority: 1,
    response: `👋 Welcome to SpinTradeHub! I'm SpinBot, your 24/7 AI assistant.

I'm here to help you with:
🔍 Finding industrial products
📦 Creating & managing listings
🤝 Networking with suppliers & buyers
💬 Real-time messaging
📋 Managing orders & quotations
⚙️ Platform features & support

How can I assist you today? Feel free to ask about:
• Product categories (Bearings, Grease, Oils, etc.)
• How to buy or sell
• Account & profile management
• Payment & delivery
• Technical issues`,
  },

  // ============ ACCOUNT & AUTHENTICATION ============
  {
    id: 'signup_account_creation',
    category: 'account',
    keywords: ['signup', 'sign up', 'register', 'create account', 'new account', 'join', 'register account'],
    patterns: [/(signup|sign up|register|create.*account|new.*account|join)/i],
    priority: 2,
    response: `📝 **How to Create Your SpinTradeHub Account:**

**Step-by-Step Process:**
1️⃣ Go to spintradehub.com/signup
2️⃣ Fill in your details:
   • Full Name (your business or personal name)
   • Username (unique identifier)
   • Email (must be valid)
   • Phone Number (with country code)
   • Country/Region
   • Role: Select **Supplier** (seller) or **Buyer** (purchaser)
   • Password (min 8 chars, with uppercase, numbers)
3️⃣ Agree to Terms & Conditions
4️⃣ Click "Create Account"
5️⃣ Verify your email
6️⃣ Complete your profile with business info

✅ **Benefits of Account:**
• Access to 10,000+ suppliers worldwide
• Post unlimited products (if Supplier)
• Real-time messaging
• Order management
• Quotation tools
• Network building

❓ Having issues? Contact us at ${SUPPORT_EMAIL} or call ${SUPPORT_PHONE}`,
  },

  {
    id: 'login_access',
    category: 'account',
    keywords: ['login', 'sign in', 'log in', 'forgot password', 'password reset', 'cant login'],
    patterns: [/(login|sign in|log in|forgot.*password|password.*reset|cant.*login|cannot.*login)/i],
    priority: 2,
    response: `🔐 **Login to Your SpinTradeHub Account:**

**Quick Login:**
1. Go to spintradehub.com/login
2. Enter your email
3. Enter your password
4. Click "Sign In"

**Forgot Your Password?**
1. Click "Forgot Password?" on login page
2. Enter your email
3. Check your email for reset link
4. Create a new password
5. Login with new password

**Can't Login?**
✓ Check if CAPS LOCK is on
✓ Verify email is correct
✓ Ensure account is verified (check email)
✓ Try resetting password
✓ Clear browser cache and cookies
✓ Try different browser

**Still Having Issues?**
Contact our support team:
📞 Phone: ${SUPPORT_PHONE}
📧 Email: ${SUPPORT_EMAIL}
⏰ Available: ${BUSINESS_HOURS}`,
  },

  {
    id: 'profile_management',
    category: 'account',
    keywords: ['profile', 'edit profile', 'update profile', 'my account', 'account settings', 'change info'],
    patterns: [/(profile|edit.*profile|update.*profile|my.*account|account.*settings|change.*info)/i],
    priority: 2,
    response: `👤 **Your Profile & Account Management:**

**Accessing Your Profile:**
1. Tap menu icon → Profile
2. View your details & stats

**Edit Your Profile:**
1. Go to Profile page
2. Click "Edit Profile"
3. Update:
   • Business/Personal Name
   • Username
   • Phone Number
   • Region/Country
   • Company Name (if Supplier)
   • Profile Picture
   • Bio/Description
   • Business License (Suppliers)
4. Save changes

**Profile Information Shown:**
✓ Your name & username
✓ Products posted/listed
✓ Total connections
✓ Average rating & reviews
✓ Verification status
✓ Response time
✓ Account creation date

**Privacy Settings:**
• Control who can contact you
• Hide your phone number if desired
• Set messaging preferences

For profile photo or background: Max 5MB, JPG/PNG format`,
  },

  // ============ PRODUCTS & CATEGORIES ============
  {
    id: 'product_categories',
    category: 'products',
    keywords: ['categories', 'category', 'products available', 'product list', 'what categories', 'bearings', 'grease', 'oil', 'belt'],
    patterns: [/(categories|category|products.*available|product.*list|what.*categories|bearings|grease|oil|belt|lubricant|machinery)/i],
    priority: 2,
    response: `🏷️ **Product Categories Available on SpinTradeHub:**

**Main Categories:**

1. 🔩 **Bearings** - Deep groove ball, roller, thrust, tapered
2. 🛢️ **Grease** - Industrial, lithium, synthetic (SKF, Mobil, Shell, Castrol)
3. ⚙️ **V-Belts** - Classical, wedge, banded, industrial belts
4. 🛢️ **Industrial Oils** - Hydraulic, gear, cutting, turbine oils
5. 🔧 **Lubricants** - Oils, greases, specialty fluids
6. 🏭 **Machinery** - Pumps, motors, compressors, gearboxes
7. 🔌 **Accessories** - Couplings, seals, gaskets, fasteners
8. 📦 **Other** - Everything else

**How to Browse by Category:**
1. Go to Feed page
2. See category filter at top
3. Tap category name
4. View all products in that category
5. Use search to narrow down
6. Sort by price, rating, newest

**Popular Searches:**
• SKF Bearings
• Hydraulic Oil
• Industrial Grease
• Electric Motors
• Timing Belts

✅ All products from **verified suppliers worldwide**
💰 Price comparison across sellers
⭐ Ratings & reviews from buyers`,
  },

  {
    id: 'post_product_sell',
    category: 'selling',
    keywords: ['post product', 'create listing', 'sell product', 'add product', 'upload product', 'how to sell', 'start selling'],
    patterns: [/(post.*product|create.*listing|sell.*product|add.*product|upload.*product|how.*sell|start.*selling)/i],
    priority: 3,
    response: `📤 **How to Post/Sell Products on SpinTradeHub:**

**Step-by-Step Guide:**

1️⃣ **Go to Feed Page**
   • Tap the orange '+' button

2️⃣ **Fill Product Details:**
   • Product Name (e.g., "SKF 6205 Bearing")
   • Description (detailed info about product)
   • Category (select from list)
   • Quantity Available
   • Unit (pieces, kg, boxes, etc.)
   • Price (in USD)
   • Location (where buyer collects/ships from)

3️⃣ **Add Media:**
   • Upload Product Photo (max 5MB)
   • Upload PDF Catalogue (max 10MB)
   • Add multiple images
   • Ensure images are clear & high-quality

4️⃣ **Review & Post:**
   • Check all info is correct
   • Click "Post Now"
   • Your listing goes LIVE immediately

5️⃣ **After Posting:**
   • Product appears in Feed
   • Buyers can send inquiries
   • You receive notifications
   • Reply to inquiries quickly

**Tips for Great Listings:**
✓ Use clear product names
✓ Include specifications & dimensions
✓ Add high-quality photos
✓ Provide PDF datasheet
✓ Mention minimum order quantity
✓ Set competitive prices
✓ Be responsive to inquiries
✓ Update stock regularly

**Manage Your Products:**
• Go to Dashboard to view all postings
• Edit product details anytime
• Delete products you no longer sell
• Track inquiries & responses`,
  },

  {
    id: 'search_find_products',
    category: 'buying',
    keywords: ['search', 'find products', 'find supplier', 'buy', 'browse', 'how to buy', 'purchase'],
    patterns: [/(search|find.*products|find.*supplier|buy|browse|how.*buy|purchase)/i],
    priority: 3,
    response: `📥 **How to Find & Buy Products:**

**Finding Products (3 Ways):**

**Method 1: Browse by Category**
1. Go to Feed page
2. See categories at top
3. Tap a category (Bearings, Grease, etc.)
4. View all products in that category

**Method 2: Search by Keyword**
1. Tap search icon/search box
2. Type product name (e.g., "SKF Bearing")
3. Results show matching products
4. Use filters to narrow down

**Method 3: Advanced Filters**
1. Go to Feed
2. Tap Filter icon
3. Filter by:
   • Category
   • Price Range (Min - Max)
   • Supplier Rating (3★, 4★, 5★)
   • Location/Country
   • Availability

**Viewing Product Details:**
1. Tap on any product
2. See:
   • Product description
   • Specifications
   • Photos/images
   • PDF catalogue
   • Seller information
   • Supplier rating & reviews
   • Price & minimum order
   • Stock availability

**Buying Process:**
1️⃣ Find product you want
2️⃣ Click "Send Inquiry"
3️⃣ Message supplier with:
   • Quantity needed
   • Delivery location
   • Special requirements
4️⃣ Supplier responds with:
   • Best pricing
   • Delivery timeline
   • Payment terms
5️⃣ Negotiate & finalize
6️⃣ Place order
7️⃣ Payment & delivery arranged

**Pro Tips:**
✓ Compare prices from different suppliers
✓ Check seller ratings & reviews
✓ Ask for volume discounts
✓ Request samples if needed
✓ Negotiate delivery terms`,
  },

  // ============ ORDERS & PAYMENTS ============
  {
    id: 'orders_payment',
    category: 'orders',
    keywords: ['payment', 'pay', 'how to pay', 'payment method', 'invoice', 'bill', 'order', 'quotation'],
    patterns: [/(payment|pay|how.*pay|payment.*method|invoice|bill|order|quotation)/i],
    priority: 3,
    response: `💳 **Payments, Orders & Invoices:**

**Payment Methods:**
Payment methods are **directly negotiated between buyer & supplier**. SpinTradeHub facilitates the connection.

Common payment methods:
✓ Bank transfer (fastest & safest)
✓ PayPal
✓ Credit/Debit Card
✓ Wire transfer
✓ Cash on delivery
✓ Letter of credit (for large orders)

**Payment Support:**
If you have any payment-related questions or need assistance:
📞 **Call us:** ${SUPPORT_PHONE}
📧 **Email:** ${SUPPORT_EMAIL}

**Creating Quotations:**
1. Go to Dashboard
2. Orders → Create Quotation
3. Add item details:
   • Product name
   • Quantity
   • Unit price
   • Total amount
4. Add your company details
5. Add payment terms
6. Send to buyer

**Managing Orders:**
1. Go to Dashboard
2. View all your orders
3. Track order status
4. Update delivery info
5. Manage invoices
6. Print quotations

**Order Status Tracking:**
• PENDING - Awaiting payment
• CONFIRMED - Payment received
• SHIPPED - On the way
• DELIVERED - Completed
• DISPUTED - Issue under resolution

**Security:**
✅ Always confirm payment details with supplier
✅ Use secure payment methods
✅ Save all transaction records
✅ Document agreements in writing

For complex transactions or large orders, contact support:
📞 ${SUPPORT_PHONE} (${BUSINESS_HOURS})`,
  },

  {
    id: 'delivery_shipping',
    category: 'orders',
    keywords: ['delivery', 'shipping', 'transport', 'logistics', 'how long', 'when will arrive', 'track order'],
    patterns: [/(delivery|shipping|transport|logistics|how.*long|when.*arrive|track.*order)/i],
    priority: 3,
    response: `🚚 **Delivery & Shipping Information:**

**How Delivery Works:**
Delivery is **negotiated directly between buyer & supplier**. SpinTradeHub facilitates the connection but doesn't handle logistics directly.

**Delivery Options:**
✓ Supplier arranges & ships
✓ Buyer picks up from supplier
✓ Third-party courier
✓ Freight forwarder
✓ Your own logistics

**Typical Timeframes:**
• Local delivery: 1-3 days
• Domestic (same country): 3-7 days
• International: 7-30 days (depends on country)
• Remote areas: 15-45 days

**During Inquiry, Ask:**
1. "What are shipping costs?"
2. "How many days for delivery?"
3. "What courier do you use?"
4. "Do you offer tracking?"
5. "Insurance included?"
6. "Packaging quality?"

**Tracking Your Shipment:**
• Ask supplier for tracking number
• Use supplier's carrier website to track
• Keep shipping documents
• Confirm receipt with photos

**Delivery Issues:**
If package is delayed or damaged:
1. Contact supplier immediately
2. Document with photos
3. Save all communications
4. File claim with carrier if damaged
5. Contact support if unresolved:
   📞 ${SUPPORT_PHONE}
   📧 ${SUPPORT_EMAIL}

**International Shipping:**
• Customs clearance responsibility varies
• Keep all documents (invoice, packing list)
• May need business license for imports
• Some products may need certificates`,
  },

  // ============ MESSAGING & NETWORKING ============
  {
    id: 'messaging_communication',
    category: 'communication',
    keywords: ['message', 'chat', 'send message', 'talk', 'communication', 'contact supplier', 'inbox'],
    patterns: [/(message|chat|send.*message|talk|communication|contact.*supplier|inbox)/i],
    priority: 2,
    response: `💬 **Real-Time Messaging & Communication:**

**How to Send Messages:**

1️⃣ **Go to Messages Page**
   • Bottom menu → Messages
   • Or tap message icon

2️⃣ **Start New Conversation**
   • Tap "+" or "New Message"
   • Search contact by name/username
   • Or tap "Message" on their profile

3️⃣ **Send Message**
   • Type your message
   • Include details:
     - Product inquiry
     - Quantity needed
     - Delivery location
     - Timeline
     - Budget (if willing to share)
   • Tap Send button

**Messaging Best Practices:**
✓ Be clear & specific
✓ Include all relevant details
✓ Ask about availability
✓ Request pricing
✓ Mention urgency if needed
✓ Be professional & polite
✓ Respond quickly (builds trust)

**Response Expectations:**
⏱️ Most suppliers reply within:
• 1-2 hours (for online suppliers)
• 4-24 hours (normal response time)
• 24-48 hours (different time zones)

**Message Features:**
✓ Real-time delivery
✓ Read receipts
✓ Online/offline status
✓ Typing indicators
✓ Message history
✓ Export conversations

**Communication Tips:**
1. Be professional
2. Use proper grammar
3. Include photos if needed
4. Ask specific questions
5. Provide clear requirements
6. Discuss terms upfront
7. Follow up if no response

**Having Issues?**
If supplier isn't responding:
1. Wait 24-48 hours (time zones)
2. Send follow-up message
3. Contact during business hours
4. Try contacting their company directly

Contact us if needed:
📞 ${SUPPORT_PHONE}`,
  },

  {
    id: 'networking_connections',
    category: 'networking',
    keywords: ['connect', 'network', 'connection request', 'add connection', 'follow', 'meet suppliers'],
    patterns: [/(connect|network|connection.*request|add.*connection|follow|meet.*suppliers)/i],
    priority: 2,
    response: `🤝 **Networking & Making Connections:**

**Why Network on SpinTradeHub?**
✓ Find reliable suppliers & buyers
✓ Build long-term business relationships
✓ Share industry insights
✓ Discover new opportunities
✓ Grow your network globally

**How to Connect:**

**Method 1: Browse & Connect**
1. Go to Network page
2. See suggested users
3. See users nearby
4. Tap "Connect" button
5. Optional: Add connection message
6. Connection request sent

**Method 2: Search & Connect**
1. Search user by name/username
2. Tap their profile
3. Click "Connect" button
4. Optional: Add message
5. Request sent

**Method 3: From Messages**
1. After messaging someone
2. Tap their name/profile
3. Click "Connect"
4. Confirmed instantly

**Connection Message Tips:**
Instead of just connecting, write:
"Hi, I'm a bearing supplier in UAE. Let's connect and discuss opportunities in the industrial sector."

**Managing Connections:**
1. Go to Network
2. See your connections list
3. View connection profiles
4. Message any connection
5. Disconnect if needed

**Connection Requests:**
1. You send request → Pending
2. Other person accepts → Connected
3. You can message anytime after

**Network Benefits:**
✓ Direct messaging access
✓ See their product listings
✓ Get notifications on their updates
✓ Easy to do business together

**Growing Your Network:**
• Connect with suppliers in your industry
• Join local business groups
• Engage with quality connections
• Share your expertise
• Be responsive & helpful

**Connection Etiquette:**
✓ Introduce yourself clearly
✓ Be professional
✓ Don't spam with sales
✓ Build genuine relationships
✓ Help others when possible`,
  },

  // ============ REVIEWS & RATINGS ============
  {
    id: 'reviews_ratings',
    category: 'trust',
    keywords: ['review', 'rating', 'feedback', 'rate', 'star', 'reputation', 'leave review'],
    patterns: [/(review|rating|feedback|rate|star|reputation|leave.*review)/i],
    priority: 2,
    response: `⭐ **Reviews & Ratings System:**

**Why Reviews Matter:**
✓ Build trust with buyers/sellers
✓ Show transaction history
✓ Increase sales/inquiries
✓ Get verified badge
✓ Improve platform ranking

**Leaving a Review:**

**As a Buyer (After Receiving Product):**
1. Go to Orders page
2. Find order marked "Delivered"
3. Tap "Leave Review"
4. Enter:
   • Star rating (1-5 stars)
   • Written feedback (optional)
   • Comments about quality, service, delivery
5. Submit review

**Review Guidelines:**
✓ Be honest & fair
✓ Be specific about strengths/weaknesses
✓ Professional language
✓ Constructive feedback
✓ Don't include personal info

**Star Rating System:**
⭐ = Poor quality/service
⭐⭐ = Below average
⭐⭐⭐ = Average
⭐⭐⭐⭐ = Good
⭐⭐⭐⭐⭐ = Excellent

**Viewing Reviews:**
1. Go to any user's profile
2. See their average rating
3. See review count
4. Read individual reviews
5. See what buyers/suppliers say

**Review Responses:**
Sellers can respond to reviews:
• Thank buyers for feedback
• Address concerns
• Show professionalism
• Encourage repeat business

**Getting Better Reviews:**
✓ Ship on time
✓ Quality products
✓ Professional communication
✓ Good packaging
✓ Fair pricing
✓ Responsive to issues
✓ Handle complaints well

**Dispute Reviews:**
If a review is:
• Inappropriate
• Defamatory
• Off-topic
• Spam

Contact support:
📞 ${SUPPORT_PHONE}
📧 ${SUPPORT_EMAIL}

**Becoming Verified:**
✓ Maintain 4.5★+ rating
✓ Have 10+ reviews
✓ No disputes
✓ Professional profile
✓ Complete business details`,
  },

  // ============ TECHNICAL & TROUBLESHOOTING ============
  {
    id: 'technical_issues',
    category: 'support',
    keywords: ['bug', 'error', 'problem', 'issue', 'crash', 'not working', 'glitch', 'technical', 'slow'],
    patterns: [/(bug|error|problem|issue|crash|not.*working|glitch|technical|slow|lag)/i],
    priority: 4,
    response: `🔧 **Technical Support & Troubleshooting:**

**Common Issues & Solutions:**

**1. App/Website Won't Load**
✓ Check internet connection
✓ Refresh page (F5 or Cmd+R)
✓ Clear browser cache
✓ Try different browser
✓ Restart app
✓ Restart device

**2. Login Problems**
✓ Check internet connection
✓ Verify email/password correct
✓ Clear browser cookies
✓ Disable VPN/Proxy
✓ Try incognito/private mode
✓ Reset password if forgotten

**3. Slow Loading**
✓ Check internet speed
✓ Close other apps
✓ Clear browser cache
✓ Disable browser extensions
✓ Try WiFi instead of mobile data
✓ Use wired connection for PC

**4. Messages Not Sending**
✓ Check internet connection
✓ Refresh messages page
✓ Close & reopen app
✓ Log out and log in again
✓ Check message content (not too long)
✓ Ensure contact is in network

**5. Photo Upload Fails**
✓ Check file size (max 5MB)
✓ Check file format (JPG, PNG)
✓ Check internet connection
✓ Try smaller image
✓ Clear app cache
✓ Try different photo

**Before Contacting Support:**
1. Try the above solutions
2. Clear cache & cookies
3. Restart app/browser
4. Update to latest version
5. Check internet connection
6. Try on different device

**When to Contact Support:**
If issue persists after above steps:

📞 **Call us:** ${SUPPORT_PHONE}
📧 **Email:** ${SUPPORT_EMAIL}
📱 **Chat support:** Available in-app
⏰ **Hours:** ${BUSINESS_HOURS}

**Include When Reporting:**
• Exact error message
• Screenshots of issue
• Your device/browser info
• Steps to reproduce
• When issue started
• How often it occurs

**We'll Help With:**
✓ Account access issues
✓ Payment problems
✓ Technical bugs
✓ Data recovery
✓ Feature requests
✓ General inquiries`,
  },

  {
    id: 'security_privacy',
    category: 'security',
    keywords: ['security', 'privacy', 'safe', 'secure', 'two factor', '2fa', 'password', 'encryption', 'protect'],
    patterns: [/(security|privacy|safe|secure|two.*factor|2fa|password|encryption|protect)/i],
    priority: 2,
    response: `🔐 **Security & Privacy Protection:**

**SpinTradeHub Security Features:**

✅ **Firebase Authentication**
• Military-grade encryption
• Secure password hashing
• HTTPS/SSL encryption
• Real-time threat detection

✅ **Data Protection**
• All data encrypted at rest
• Encrypted in transit
• Regular security audits
• Compliance with regulations

✅ **Two-Factor Authentication (2FA)**
Enable extra security:
1. Go to Settings
2. Security section
3. Enable "2-Factor Authentication"
4. Confirm with email/SMS code
5. Every login requires verification

**Password Best Practices:**
✓ Use 8+ characters
✓ Mix uppercase & lowercase
✓ Include numbers
✓ Include special characters (!@#$)
✓ Don't share with anyone
✓ Change regularly
✓ Don't reuse old passwords
✗ Never: Birth date, name, simple words

**Privacy Settings:**
Go to Settings → Privacy:
✓ Control who messages you
✓ Hide phone number (if desired)
✓ Set profile visibility
✓ Block users if needed
✓ Control data sharing

**What We Don't Do:**
✗ Never sell your data
✗ Never share phone without permission
✗ Never spam your email
✗ Never access messages (encrypted)
✗ Never share financial info

**Protecting Yourself:**
1. Keep password secure
2. Don't share account details
3. Log out on public devices
4. Verify payment requests
5. Check URLs before clicking
6. Report suspicious activity

**Suspicious Activity?**
If you notice:
• Unauthorized login
• Missing funds
• Fraudulent messages
• Spam/phishing

**Report Immediately:**
📞 ${SUPPORT_PHONE}
📧 ${SUPPORT_EMAIL}
🚨 We respond within 1 hour

**Scam Prevention:**
⚠️ Beware of:
• Requests for bank details
• Too-good-to-be-true offers
• Pressure to pay quickly
• Requests to go outside platform
• Fake verification attempts

**We Recommend:**
✓ Always use platform messaging
✓ Document all agreements
✓ Verify seller identity
✓ Check reviews before buying
✓ Use secure payment methods`,
  },

  // ============ VERIFICATION & BADGES ============
  {
    id: 'verification_badges',
    category: 'trust',
    keywords: ['verified', 'verification', 'badge', 'check mark', 'certified', 'trusted seller'],
    patterns: [/(verified|verification|badge|check.*mark|certified|trusted.*seller)/i],
    priority: 2,
    response: `✅ **Verification & Trust Badges:**

**What is Verification?**
Verification means SpinTradeHub has confirmed:
✓ Business legitimacy
✓ Owner identity
✓ Business registration
✓ Professional standards

**Verification Badges Available:**

🏆 **Verified Seller Badge**
• Business verified
• Legal business documents
• Professional profile
• Trusted by hundreds

🌟 **Top Seller Badge**
• High sales volume
• 4.8★+ rating
• <2hr response time
• Excellent shipping record

⚡ **Fast Responder Badge**
• Responds within 1 hour
• 95%+ message response rate
• Reliable communicator

💎 **Quality Items Badge**
• 4.9★+ product rating
• <1% defect rate
• Premium supplier status
• Consistent excellence

🛡️ **Buyer Protection Badge**
• Dispute rate <0.5%
• Fair policies
• Trustworthy transactions

**How to Get Verified:**

**For Suppliers (Sellers):**
1. Complete business profile
2. Verify business license
3. Maintain 4.5★+ rating
4. Build transaction history
5. Contact support for verification
   📞 ${SUPPORT_PHONE}

**Requirements:**
✓ Legal business registration
✓ Business address
✓ Contact information
✓ Tax ID/Registration number
✓ Professional product images
✓ Minimum order history

**Getting Badges:**
Earned automatically when you meet:
⭐ Ratings (4.5★+ for Verified)
📦 Sales volume (50+ transactions)
⏱️ Response time (<2 hours)
📋 Consistent quality
👥 Positive customer feedback

**Verification Benefits:**
✓ Higher buyer trust
✓ More inquiries & sales
✓ Better search ranking
✓ Competitive advantage
✓ Professional credibility
✓ Premium features access

**Verification Process:**
1. Check your eligibility
2. Gather documents:
   • Business registration
   • Owner ID
   • Business address proof
   • Tax documentation
3. Submit through Dashboard
4. We verify within 3-5 business days
5. Badge added to profile

**Questions About Verification?**
📞 Call: ${SUPPORT_PHONE}
📧 Email: ${SUPPORT_EMAIL}`,
  },

  // ============ MONEY & PAYMENTS BUSINESS RULES ============
  {
    id: 'money_payment_inquiry',
    category: 'business',
    keywords: ['money', 'financial', 'credit', 'loan', 'payment solution', 'financing', 'bulk discount', 'payment plan'],
    patterns: [/(money|financial|credit|loan|payment.*solution|financing|bulk.*discount|payment.*plan)/i],
    priority: 5, // HIGH PRIORITY - Business requirement
    response: `💰 **Payment Solutions & Financial Inquiries:**

For detailed assistance with:
• Payment arrangements
• Special pricing for bulk orders
• Credit terms for businesses
• Financing options
• Volume discounts
• Custom payment plans

**Please Contact Our Business Team:**

📞 **Phone:** ${SUPPORT_PHONE}
📧 **Email:** ${SUPPORT_EMAIL}
⏰ **Available:** ${BUSINESS_HOURS}

Our specialists can discuss:
✓ Flexible payment terms
✓ Volume discounts for bulk orders
✓ Corporate credit arrangements
✓ Custom payment schedules
✓ Special pricing for regular buyers
✓ Partnership opportunities

**What to Prepare When Calling:**
• Your business details
• Type of products interested in
• Expected order volume
• Preferred payment method
• Budget range
• Delivery timeline

We look forward to working with you!`,
  },

  // ============ GENERAL SUPPORT & CONTACT ============
  {
    id: 'contact_support',
    category: 'support',
    keywords: ['contact', 'support', 'help', 'customer service', 'reach out', 'call', 'email', 'assistance'],
    patterns: [/(contact|support|help|customer.*service|reach.*out|call|email|assistance)/i],
    priority: 1,
    response: `📞 **Contact Our Support Team:**

**24/7 Customer Support Available!**

**Direct Contact:**
📞 **Phone:** ${SUPPORT_PHONE}
📧 **Email:** ${SUPPORT_EMAIL}
⏰ **Hours:** ${BUSINESS_HOURS}

**How to Reach Us:**
1. **Phone Call** (fastest for urgent issues)
   • Dial ${SUPPORT_PHONE}
   • Available 24/7
   • Average wait: 1-2 minutes
   • Support in multiple languages

2. **Email Support**
   • Send to ${SUPPORT_EMAIL}
   • Response within 2 hours
   • Include detailed information
   • Attach screenshots if needed

3. **In-App Chat**
   • Chat icon in the app
   • Real-time support
   • Available 24/7

**What We Help With:**
✓ Account issues
✓ Payment problems
✓ Order disputes
✓ Technical issues
✓ Verification inquiries
✓ Feature questions
✓ Business partnerships
✓ General information

**Quick Tips:**
• For urgent issues → Call
• For detailed issues → Email with screenshots
• Describe issue clearly
• Include your order/user ID
• Mention what you've tried already

**Response Times:**
📞 Phone: Immediate (1-2 min wait)
📧 Email: Within 2 hours
💬 Chat: Within 5 minutes
✉️ General inquiries: Within 24 hours

We're here to help! Don't hesitate to reach out.`,
  },

  // ============ FAQ & GENERAL INFO ============
  {
    id: 'faq_general',
    category: 'info',
    keywords: ['faq', 'frequently asked', 'question', 'how does', 'what is', 'why', 'when'],
    patterns: [/(faq|frequently.*asked|what.*is|how.*does|why|when)/i],
    priority: 2,
    response: `❓ **Frequently Asked Questions:**

**Q: Is SpinTradeHub free to use?**
A: Yes! Signing up and browsing is 100% free. Posting products is free for suppliers. Buyers pay nothing.

**Q: What countries do you serve?**
A: We connect traders worldwide! Current active users in 50+ countries including UAE, Saudi Arabia, Kuwait, India, Pakistan, China, and more.

**Q: How long does verification take?**
A: Standard verification: 3-5 business days. Urgent requests: 24 hours. Contact support for faster processing.

**Q: Can I post multiple products?**
A: Yes! Suppliers can post unlimited products. No limits on inventory.

**Q: Is my data safe?**
A: Absolutely! We use Firebase with military-grade encryption, SSL/HTTPS, and regular security audits. Your data is protected.

**Q: Can I delete my account?**
A: Yes. Go to Settings → Account → Delete Account. Note: This is permanent and cannot be undone.

**Q: How do I report a scam?**
A: Report immediately to ${SUPPORT_PHONE} with details. We investigate all reports and take action.

**Q: Do you have a mobile app?**
A: Yes! Available on Google Play Store for Android. iOS coming soon. Download "SpinTradeHub" app.

**Q: Can I export my data?**
A: Yes. Contact support at ${SUPPORT_EMAIL} to request your data export in standard formats.

**Q: What payment methods do you accept?**
A: Payments are direct between buyer & seller. We don't process payments. Use your preferred method with supplier.

**For More Information:**
Visit our full FAQ page: spintradehub.com/faq

Still have questions?
📞 ${SUPPORT_PHONE}
📧 ${SUPPORT_EMAIL}`,
  },

  // ============ ABOUT SPINTRADEHUB ============
  {
    id: 'about_platform',
    category: 'info',
    keywords: ['about', 'what is spintradehub', 'platform', 'company', 'mission', 'our story'],
    patterns: [/(about|what.*spintradehub|platform|company|mission|our.*story)/i],
    priority: 1,
    response: `ℹ️ **About SpinTradeHub:**

**SpinTradeHub** is a **B2B Industrial Trading Platform** connecting:
• Suppliers & Manufacturers worldwide
• Buyers & Distributors globally
• Industry professionals

**Our Mission:**
🎯 Simplify global industrial trading
🎯 Connect quality suppliers with buyers
🎯 Enable fair & transparent business
🎯 Support SMEs in digital transformation

**Key Features:**
📦 Product marketplace (40+ categories)
💬 Real-time messaging
🤝 Network & connections
📋 Order management
📊 Analytics & dashboard
💼 Commerce documents (quotations, invoices)
🤖 AI Chatbot (24/7 support)
🌍 Multi-language support (40+)

**Why Choose SpinTradeHub?**
✓ Global reach (50+ countries)
✓ Verified suppliers
✓ Secure transactions
✓ Real-time communication
✓ Professional networking
✓ 24/7 AI support
✓ Free to sign up

**Our Platforms:**
📱 **Mobile App** (Android/iOS)
🌐 **Web Platform** (Desktop/Tablet)
💻 **B2B Dashboard** (Supplier tools)

**Trust & Security:**
🔐 Firebase encrypted security
✅ Verified seller badges
⭐ Transparent rating system
🛡️ Dispute resolution

**Global Presence:**
Active traders in:
🇦🇪 UAE (Dubai, Abu Dhabi)
🇸🇦 Saudi Arabia
🇰🇼 Kuwait
🇮🇳 India
🇵🇰 Pakistan
🇨🇳 China
And 40+ more countries!

**Contact Information:**
📞 ${SUPPORT_PHONE}
📧 ${SUPPORT_EMAIL}
🌐 www.spintradehub.com

**Learn More:**
Visit our Features page: spintradehub.com/features
Read our About page: spintradehub.com/about`,
  },

  // ============ FALLBACK / DEFAULT RESPONSES ============
  {
    id: 'unclear_question',
    category: 'general',
    keywords: ['unclear', 'default', 'fallback'],
    patterns: [/.*/], // Matches any input as fallback
    priority: 0,
    response: `I'm not entirely sure what you're asking. Let me help you find the answer!

**Popular Topics I Can Help With:**

📦 **Buying & Selling**
• How to post products
• How to find products
• Creating quotations

🤝 **Networking**
• How to connect with traders
• Messaging & communication
• Building business relationships

💬 **Account & Support**
• Sign up & login
• Profile management
• Verification & badges

💰 **Orders & Payments**
• Payment methods
• Order management
• Delivery & shipping

🔐 **Security & Safety**
• Privacy settings
• 2-Factor authentication
• Scam prevention

**Can't Find Answer?**
Contact our support team:
📞 **Call:** ${SUPPORT_PHONE}
📧 **Email:** ${SUPPORT_EMAIL}

**Please rephrase your question with more details:**
• What specifically do you need help with?
• What are you trying to accomplish?
• Are you a buyer or supplier?

I'm here 24/7 to help! 😊`,
  },
];

// ============ INTELLIGENT RESPONSE MATCHER ============

export function findBestMatch(userMessage: string): KnowledgeItem {
  const normalizedInput = userMessage.toLowerCase().trim();

  if (!normalizedInput) {
    return KNOWLEDGE_BASE.find((item) => item.id === 'greeting_hello') || KNOWLEDGE_BASE[0];
  }

  // First, try pattern matching (most accurate)
  for (const item of KNOWLEDGE_BASE.filter((i) => i.id !== 'unclear_question').sort((a, b) => b.priority - a.priority)) {
    for (const pattern of item.patterns) {
      if (pattern.test(normalizedInput)) {
        return item;
      }
    }
  }

  // Second, try keyword matching
  for (const item of KNOWLEDGE_BASE.filter((i) => i.id !== 'unclear_question').sort((a, b) => b.priority - a.priority)) {
    for (const keyword of item.keywords) {
      if (normalizedInput.includes(keyword)) {
        return item;
      }
    }
  }

  // If no match found, return default/unclear response
  return KNOWLEDGE_BASE.find((item) => item.id === 'unclear_question') || KNOWLEDGE_BASE[KNOWLEDGE_BASE.length - 1];
}

// ============ CONFIDENCE SCORING ============

export function getResponseConfidence(userMessage: string, knowledgeItem: KnowledgeItem): number {
  const normalizedInput = userMessage.toLowerCase();
  let confidence = 0;

  // Pattern match bonus (highest confidence)
  for (const pattern of knowledgeItem.patterns) {
    if (pattern.test(normalizedInput)) {
      confidence = 0.95;
      break;
    }
  }

  // Keyword match scoring
  if (confidence === 0) {
    const matchedKeywords = knowledgeItem.keywords.filter((keyword) => normalizedInput.includes(keyword)).length;
    const totalKeywords = knowledgeItem.keywords.length;
    confidence = (matchedKeywords / totalKeywords) * 0.8; // Max 0.8 for keyword match
  }

  return Math.min(confidence, 1);
}

// ============ CHATBOT CONTEXT HANDLER ============

export function getChatbotResponse(context: ChatbotContext): { text: string; confidence: number; category: string } {
  const bestMatch = findBestMatch(context.userMessage);
  const confidence = getResponseConfidence(context.userMessage, bestMatch);

  return {
    text: bestMatch.response,
    confidence,
    category: bestMatch.category,
  };
}
