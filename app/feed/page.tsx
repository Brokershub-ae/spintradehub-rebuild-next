'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { productService, userService } from '@/lib/firebase-service';
import { wishlistService } from '@/lib/firebase-wishlist';
import { listenToAllPosts } from '@/lib/realtime-sync';
import { BuyModal } from '@/components/BuyModal';
import { useToast } from '@/lib/toast-context';
import { notificationService } from '@/lib/firebase-notifications';
import { messagingService } from '@/lib/firebase-messaging';
import Link from 'next/link';
import { matchesProductSearch, PRODUCT_CONDITIONS } from '@/lib/product-details';
import ProductSpecifications from '@/components/ProductSpecifications';
import shoppingStyles from '@/components/ProductShopping.module.css';
import { discoveryCountry, TRADING_COUNTRIES } from '@/lib/discovery-country';

function FeedPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [locationScope, setLocationScope] = useState('All Countries');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, number>>({});
  const [activeImage, setActiveImage] = useState<{ src: string; name: string } | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedBrand = searchParams.get('brand')?.trim() || '';
  const hasShownFeedToastRef = useRef(false);
  const selectedCondition = searchParams.get('condition') || '';
  const selectedSupplier = searchParams.get('supplier') || '';
  const [maxMinimumOrder, setMaxMinimumOrder] = useState('');
  const [minimumOrderUnit, setMinimumOrderUnit] = useState('');
  const availableBrands = Array.from(new Set(products.map(p => String(p.brand || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const availableUnits = Array.from(new Set(products.map(p => String(p.minimumOrderUnit || '').trim().toLowerCase()).filter(Boolean))).sort();
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/feed${params.size ? `?${params}` : ''}`, { scroll: false });
  };

  const categories = ['All', 'Bearings', 'Grease', 'V-Belts', 'Industrial Oils', 'Lubricants', 'Machinery', 'Accessories'];
  const normalizeCategoryValue = (value: string) => String(value || '').trim().toLowerCase().replace(/[\s-]/g, '');
  const countryList = [
    'All Countries',
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria',
    'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
    'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia',
    'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica',
    'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
    'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon',
    'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives',
    'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia',
    'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
    'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea',
    'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
    'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
    'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
    'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia',
    'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
    'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
  ];

  const normalizeComments = (comments: any[] = []) => {
    if (!Array.isArray(comments)) return [];
    return comments.filter(Boolean).sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
  };

  const getCreatorDisplayLabel = (product: any) => {
    const rawName = product?.creatorName || product?.userName || product?.creatorDisplayName || '';
    const rawId = product?.creatorId || product?.userId || product?.seller || '';
    const profileName = product?.profileName || product?.profile?.name || product?.profile?.username || '';

    const looksLikeId = (value: string) => {
      const normalized = value.trim();
      if (!normalized) return false;
      if (normalized.toLowerCase() === 'unknown' || normalized.toLowerCase() === 'user') return true;
      if (rawId && normalized === rawId) return true;
      return /^[A-Za-z0-9_-]{16,}$/.test(normalized);
    };

    if (profileName && !looksLikeId(profileName)) return profileName;
    if (rawName && !looksLikeId(rawName)) return rawName;

    return 'User';
  };

  const getProductInteraction = (product: any) => {
    const comments = normalizeComments(product?.comments || []);
    const liked = Boolean(user && Array.isArray(product?.likedBy) && product.likedBy.includes(user.uid));
    return {
      liked,
      likes: Number(product?.likes ?? 0),
      comments,
      shares: Number(product?.shares ?? 0),
      rating: Number(product?.rating ?? 0),
      reviewCount: Number(product?.reviewCount ?? 0),
    };
  };

  const getCountryValue = (product: any) => {
    const rawLocation = String(product?.location || product?.region || '').trim();
    return discoveryCountry(rawLocation) || rawLocation;
  };

  const availableCountryOptions = Array.from(new Set([
    ...countryList.map(country => discoveryCountry(country) || country),
    ...TRADING_COUNTRIES,
    ...products.map((product) => getCountryValue(product)).filter(Boolean),
  ])).filter(Boolean) as string[];

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const searchFromUrl = searchParams.get('search');
    const countryFromUrl = searchParams.get('country');
    setLocationScope(countryFromUrl ? discoveryCountry(countryFromUrl) || countryFromUrl : 'All Countries');

    if (categoryFromUrl) {
      const matchedCategory = categories.find((category) => normalizeCategoryValue(category) === normalizeCategoryValue(categoryFromUrl));
      setSelectedCategory(matchedCategory || 'All');
    } else {
      setSelectedCategory('All');
    }

    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    } else {
      setSearchQuery('');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!hasShownFeedToastRef.current) {
      hasShownFeedToastRef.current = true;
      const timer = window.setTimeout(() => {
        addToast({
          type: 'info',
          title: 'Marketplace tip',
          message: 'Use filters, categories, and country options to quickly narrow your search.',
          duration: 4200,
        });
      }, 900);

      return () => window.clearTimeout(timer);
    }
  }, [addToast]);

  useEffect(() => {
    if (!user?.uid) {
      setUnreadNotificationCount(0);
      setUnreadMessageCount(0);
      return;
    }

    let notificationUnsubscribe: (() => void) | undefined;
    let messageUnsubscribe: (() => void) | undefined;

    const syncNotifications = async () => {
      const unread = await notificationService.getUnreadNotifications(user.uid);
      setUnreadNotificationCount(unread.length);
      notificationUnsubscribe = notificationService.listenToNotifications(user.uid, (notifications) => {
        setUnreadNotificationCount(notifications.filter((item) => !item.read).length);
      });
    };

    const syncMessages = async () => {
      const unreadCount = await messagingService.getUnreadMessageCount(user.uid);
      setUnreadMessageCount(unreadCount);
      messageUnsubscribe = messagingService.listenToUnreadMessageCount(user.uid, (count) => {
        setUnreadMessageCount(count);
      });
    };

    syncNotifications();
    syncMessages();

    return () => {
      notificationUnsubscribe?.();
      messageUnsubscribe?.();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);

    // Safety timeout — never stay stuck on loading more than 8 seconds
    const timeout = setTimeout(() => setLoading(false), 8000);

    // Real-time listener for all posts
    const unsubscribePosts = listenToAllPosts(async (posts) => {
      try {
        const creatorIds = Array.from(new Set(
          posts
            .map((post: any) => post.creatorId || post.userId || post.creator || post.seller)
            .filter(Boolean) as string[]
        ));

        const profiles = await Promise.all(
          creatorIds.map(async (creatorId: string) => {
            try {
              const profile = await userService.getUserProfile(creatorId);
              return [creatorId, profile];
            } catch {
              return [creatorId, null];
            }
          })
        );

        const profileMap = new Map(profiles.filter(Boolean).map(([id, profile]) => [id, profile]));
        const enrichedPosts = posts.map((post: any) => {
          const creatorId = post.creatorId || post.userId || (post as any).creator || (post as any).seller;
          const profile = creatorId ? profileMap.get(creatorId) : null;
          const resolvedName = post.creatorName || ((profile as any)?.name || (profile as any)?.username || post.userName || 'User');

          return {
            ...post,
            creatorId,
            userId: creatorId || post.userId,
            creatorName: resolvedName,
            profileName: (profile as any)?.name || (profile as any)?.username || '',
            profile: profile || null,
          };
        });

        setProducts(enrichedPosts);
      } catch (error) {
        console.error('Failed to enrich post creator data:', error);
        setProducts(posts);
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribePosts?.();
      clearTimeout(timeout);
    };
  }, [user, authLoading, router]);

  // Load wishlist on mount
  useEffect(() => {
    if (user) {
      wishlistService.getUserWishlist(user.uid).then((items) => {
        const wishlistIds = new Set(items.map((item: any) => item.productId || item.id).filter(Boolean) as string[]);
        setWishlisted(wishlistIds);
      }).catch((error) => {
        console.error('Failed to load wishlist:', error);
        // Continue without wishlist if it fails
        setWishlisted(new Set());
      });
    }
  }, [user]);

  const handleWishlistToggle = async (productId: string, productName: string, price: any, sellerName: string, sellerId: string, imageUri?: string) => {
    if (!user) {
      console.warn('⚠️ User not authenticated');
      addToast({ type: 'warning', title: 'Login Required', message: 'Please login to save items' });
      return;
    }

    console.log('🔄 Toggling wishlist for product:', productId, 'User:', user.uid);

    try {
      if (wishlisted.has(productId)) {
        // Remove from wishlist
        console.log('📍 Removing from wishlist...');
        const item = await wishlistService.getUserWishlist(user.uid).catch((err) => {
          console.error('Error fetching wishlist:', err);
          return [];
        });
        const wishItem = item.find((w: any) => w.productId === productId);
        if (wishItem?.id) {
          await wishlistService.removeFromWishlist(wishItem.id);
          setWishlisted(prev => {
            const updated = new Set(prev);
            updated.delete(productId);
            return updated;
          });
          console.log('✅ Removed from wishlist');
          addToast({ type: 'success', title: 'Removed', message: `${productName} removed from wishlist` });
        } else {
          console.warn('⚠️ Wishlist item not found');
          addToast({ type: 'warning', title: 'Not Found', message: 'Could not find item in wishlist' });
        }
      } else {
        // Add to wishlist
        console.log('📍 Adding to wishlist with seller:', sellerId, sellerName);
        const docId = await wishlistService.addToWishlist(user.uid, productId, productName, String(price), sellerName, sellerId, imageUri);
        console.log('✅ Added to wishlist with ID:', docId);
        setWishlisted(prev => new Set([...prev, productId]));
        addToast({ type: 'success', title: 'Saved', message: `${productName} added to wishlist` });
      }
    } catch (error) {
      console.error('❌ Wishlist error:', error);
      addToast({ type: 'error', title: 'Error', message: 'Failed to update wishlist. Try again.' });
    }
  };

  useEffect(() => {
    let filtered = products.filter((p) => {
      try {
        const matchesSearch = matchesProductSearch(p, searchQuery);
        const matchesCategory = selectedCategory === 'All' || normalizeCategoryValue(p.category) === normalizeCategoryValue(selectedCategory);
        const matchesCountry = locationScope === 'All Countries' || getCountryValue(p) === locationScope || getCountryValue(p).toLowerCase() === locationScope.toLowerCase();
        const matchesBrand = !selectedBrand || String(p.brand || '').trim().toLowerCase() === selectedBrand.toLowerCase();
        const matchesCondition = !selectedCondition || p.condition === selectedCondition;
        const filterMinimumOrder = Number(maxMinimumOrder) > 0 && minimumOrderUnit;
        const matchesMinimumOrder = !filterMinimumOrder || (
          Number(p.minimumOrderQuantity) > 0 &&
          Number(p.minimumOrderQuantity) <= Number(maxMinimumOrder) &&
          String(p.minimumOrderUnit || '').trim().toLowerCase() === minimumOrderUnit
        );
        const matchesSupplier = !selectedSupplier || (
          (p.creatorId || p.userId || p.creator || p.seller) === selectedSupplier && p.postType !== 'BUY'
        );
        return matchesSearch && matchesCategory && matchesCountry && matchesBrand && matchesCondition && matchesMinimumOrder && matchesSupplier;
      } catch (err) {
        console.error('Filter error for product:', p, err);
        return false;
      }
    });

    if (sortBy === 'newest') {
      filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } else if (sortBy === 'price-low') {
      filtered.sort((a, b) => {
        const priceA = parseFloat(String(a.price || '0').replace(/[^0-9.]/g, '')) || 0;
        const priceB = parseFloat(String(b.price || '0').replace(/[^0-9.]/g, '')) || 0;
        return priceA - priceB;
      });
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => {
        const priceA = parseFloat(String(a.price || '0').replace(/[^0-9.]/g, '')) || 0;
        const priceB = parseFloat(String(b.price || '0').replace(/[^0-9.]/g, '')) || 0;
        return priceB - priceA;
      });
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, sortBy, locationScope, selectedBrand, selectedCondition, maxMinimumOrder, minimumOrderUnit, selectedSupplier]);

  const handleViewProfile = (product: any) => {
    const profileId = product.creatorId || product.userId || product.seller;
    if (!profileId) {
      addToast({ type: 'warning', title: 'Profile unavailable', message: 'This post does not include a profile link.' });
      return;
    }

    router.push(`/profile/${profileId}`);
  };

  const handleInquiryClick = async (product: any) => {
    try {
      // Get seller ID with fallback
      const sellerId = product.creatorId || product.userId || product.seller;
      if (!sellerId) {
        addToast({ type: 'error', title: 'Error', message: 'Seller information not available' });
        return;
      }

      // Get seller info
      const seller = await userService.getUserProfile(sellerId).catch(() => null);
      setSelectedProduct(product);
      setSelectedSeller(seller);
      setShowBuyModal(true);
    } catch (error) {
      console.error('Error opening buy modal:', error);
      addToast({ type: 'error', title: 'Error', message: 'Failed to open order form' });
    }
  };

  const notifyPostOwner = async (product: any, kind: 'like' | 'share' | 'review') => {
    if (!user || !product?.id) return;

    const creatorId = product.creatorId || product.userId || product.seller;
    if (!creatorId || creatorId === user.uid) return;

    const actorName = user.displayName || user.email || 'Someone';
    const title = kind === 'like'
      ? '💙 New like'
      : kind === 'share'
        ? '🔗 Post shared'
        : '⭐ New review';
    const message = kind === 'like'
      ? `${actorName} liked your post “${product.productName || 'this post'}”.`
      : kind === 'share'
        ? `${actorName} shared your post “${product.productName || 'this post'}”.`
        : `${actorName} reviewed your post “${product.productName || 'this post'}”.`;

    try {
      await notificationService.createNotification(
        creatorId,
        kind === 'review' ? 'REVIEW' : 'POST_INTERACTION',
        title,
        message,
        `/${product.id}`
      );
    } catch (error) {
      console.error('Failed to create post interaction notification:', error);
    }
  };

  const handleLikeToggle = async (product: any) => {
    if (!user || !product?.id) return;

    try {
      const currentLiked = Array.isArray(product.likedBy) && product.likedBy.includes(user.uid);
      const nextLikedBy = currentLiked
        ? (product.likedBy || []).filter((id: string) => id !== user.uid)
        : [...(product.likedBy || []), user.uid];

      const nextLikes = Math.max(0, Number(product.likes || 0) + (currentLiked ? -1 : 1));

      await productService.updatePost(product.id, {
        likedBy: nextLikedBy,
        likes: nextLikes,
      });

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, likedBy: nextLikedBy, likes: nextLikes }
            : item
        )
      );

      if (!currentLiked) {
        await notifyPostOwner(product, 'like');
      }

      addToast({ type: 'success', title: currentLiked ? 'Like removed' : 'Post liked', message: currentLiked ? 'Your like was removed.' : 'You liked this post.' });
    } catch (error) {
      console.error('Like update failed:', error);
      addToast({ type: 'error', title: 'Error', message: 'Unable to update the like count. Please try again.' });
    }
  };

  const handleAddComment = async (product: any) => {
    if (!user || !product?.id) return;

    const draft = (commentDrafts[product.id] || '').trim();
    if (!draft) {
      addToast({ type: 'warning', title: 'Comment empty', message: 'Write something before posting a comment.' });
      return;
    }

    try {
      const nextComment = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        user: user.displayName || user.email || 'You',
        userId: user.uid,
        text: draft,
        timestamp: Date.now(),
      };

      const existingComments = normalizeComments(product.comments || []);
      const nextComments = [nextComment, ...existingComments];

      await productService.updatePost(product.id, { comments: nextComments });

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, comments: nextComments }
            : item
        )
      );

      setCommentDrafts((prev) => ({ ...prev, [product.id]: '' }));
      setExpandedComments((prev) => ({ ...prev, [product.id]: true }));
      addToast({ type: 'success', title: 'Comment posted', message: 'Your comment was added to this post.' });
    } catch (error) {
      console.error('Comment save failed:', error);
      addToast({ type: 'error', title: 'Error', message: 'Unable to post the comment. Please try again.' });
    }
  };

  const handleSharePost = async (product: any) => {
    const shareUrl = `${window.location.origin}/${product.id}`;
    const shareText = `Check this product on SpinTradeHub: ${product.productName} - Contact seller`;

    try {
      if (navigator.share) {
        await navigator.share({ title: product.productName, text: shareText, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      } else if (typeof window !== 'undefined') {
        window.prompt('Copy this link:', `${shareText} ${shareUrl}`);
      }

      const nextShares = Number(product.shares || 0) + 1;
      await productService.updatePost(product.id, { shares: nextShares });

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, shares: nextShares }
            : item
        )
      );

      await notifyPostOwner(product, 'share');
      addToast({ type: 'success', title: 'Post shared', message: 'Your post link is ready to share.' });
    } catch (error) {
      console.error('Share failed:', error);
      addToast({ type: 'warning', title: 'Share canceled', message: 'The share action was canceled.' });
    }
  };

  const handleSubmitReview = async (product: any) => {
    if (!user || !product?.id) return;

    const rating = Number(reviewDrafts[product.id] ?? 5);
    const currentRating = Number(product.rating || 0);
    const currentReviewCount = Number(product.reviewCount || 0);
    const nextReviewCount = currentReviewCount + 1;
    const nextAverage = ((currentRating * currentReviewCount) + rating) / nextReviewCount;

    try {
      await productService.updatePost(product.id, {
        rating: Number(nextAverage.toFixed(1)),
        reviewCount: nextReviewCount,
      });

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, rating: Number(nextAverage.toFixed(1)), reviewCount: nextReviewCount }
            : item
        )
      );

      setExpandedReviews((prev) => ({ ...prev, [product.id]: false }));
      setReviewDrafts((prev) => ({ ...prev, [product.id]: 5 }));
      await notifyPostOwner(product, 'review');
      addToast({ type: 'success', title: 'Review submitted', message: `You rated this post ${rating}/5.` });
    } catch (error) {
      console.error('Review save failed:', error);
      addToast({ type: 'error', title: 'Error', message: 'Unable to save the review. Please try again.' });
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10, animation: 'fadeInUp 650ms ease-out both' }}>
        <div style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/logo_latest.png" alt="SpinTradeHub logo" style={{ width: '180px', height: '80px', objectFit: 'contain', display: 'block' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                href="/notifications"
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: '999px',
                  backgroundColor: unreadNotificationCount > 0 ? '#ff8c00' : 'rgba(255,255,255,0.2)',
                  fontSize: '14px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Post interaction notifications"
              >
                🔔 {unreadNotificationCount > 0 ? unreadNotificationCount : ''}
              </Link>
              <Link href="/chatbot" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>AI Chat Support</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="feedLayout">
        <aside className="feedSidebar">
          <Link href="/create-post" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', backgroundColor: '#FF8C00', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>
            ➕ New Post
          </Link>
          <div className="feedGroup">
            <span className="feedLabel">Categories</span>
            <div className="feedCats">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className="feedCatBtn" style={{ backgroundColor: selectedCategory === cat ? '#0056D2' : '#F1F5F9', color: selectedCategory === cat ? 'white' : '#334155' }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="feedGroup">
            <span className="feedLabel">Sort by</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '13px', backgroundColor: 'white', cursor: 'pointer', width: '100%' }}>
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
          <div className="feedGroup">
            <span className="feedLabel">Country</span>
            <select value={locationScope} onChange={(e) => updateFilter('country', e.target.value === 'All Countries' ? '' : e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '13px', backgroundColor: 'white', cursor: 'pointer', width: '100%' }}>
              {availableCountryOptions.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
        </aside>

        <div className="feedMain">
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '12px' }}>
            <input type="text" aria-label="Search products, brands or part numbers" placeholder="Product, brand or part number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')} onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} />
          </div>

        {selectedSupplier && <p>Showing this supplier&apos;s catalogue. <button type="button" onClick={() => updateFilter('supplier', '')}>Show all suppliers</button></p>}
        {selectedBrand && <p>Brand: <strong>{selectedBrand}</strong> <button type="button" onClick={() => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete('brand');
          router.replace(`/feed${params.size ? `?${params}` : ''}`);
        }}>Clear brand filter</button></p>}

        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: '#999', fontSize: '14px' }}>No products found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: `fadeInUp 650ms ease-out ${index * 80}ms both`,
                }}
                onClick={() => {
                  if (product?.id) {
                    router.push(`/${product.id}`);
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && product?.id) {
                    e.preventDefault();
                    router.push(`/${product.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
                onMouseOver={(e) => (
                  (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'),
                  (e.currentTarget.style.transform = 'translateY(-2px)')
                )}
                onMouseOut={(e) => (
                  (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'),
                  (e.currentTarget.style.transform = 'translateY(0)')
                )}
              >
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Link href={`/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ width: '100%', height: '180px', backgroundColor: '#E0E0E0', overflow: 'hidden', position: 'relative' }}>
                      {(() => {
                        // Check all possible image field names (Android app uses different names)
                        const imageUrl = product.imageUri || product.imageUris?.[0] || product.imageUrl || product.image || product.photo || product.thumbnail || product.photoUrl || product.img || '';
                        if (imageUrl && imageUrl.length > 0) {
                          return (
                            <>
                              <img
                                src={imageUrl}
                                alt={product.productName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#999;background:#F5F5F5;gap:8px"><span style="font-size:32px">📦</span><span style="font-size:12px;font-weight:600">${product.category || 'Product'}</span></div>`;
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveImage({ src: imageUrl, name: product.productName || 'Post image' });
                                }}
                                style={{
                                  position: 'absolute',
                                  left: '10px',
                                  top: '10px',
                                  border: 'none',
                                  borderRadius: '999px',
                                  backgroundColor: 'rgba(17, 24, 39, 0.72)',
                                  color: 'white',
                                  padding: '6px 10px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                }}
                              >
                                View Image
                              </button>
                            </>
                          );
                        }
                        return (
                          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px', fontWeight: '600', backgroundColor: '#F5F5F5', gap: '8px' }}>
                            <span style={{ fontSize: '32px' }}>📦</span>
                            <span>{product.category || 'Product'}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#0056D2', backgroundColor: 'rgba(0,86,210,0.1)', borderRadius: '8px', padding: '4px 8px', alignSelf: 'flex-start', marginBottom: '8px' }}>{product.postType}</span>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: '0 0 8px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.productName}</h3>
                      <ProductSpecifications product={{ ...product, pdfUri: undefined }} />
                      <div style={{ fontSize: '12px', color: '#999', margin: '0 0 8px 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {String(product.description || '').split('\n').filter(Boolean).map((line: string, index: number) => (
                          <div key={`${product.id}-${index}`} style={{ marginBottom: '2px' }}>
                            {line.trim().startsWith('•') || line.trim().startsWith('-') ? line.trim() : `• ${line.trim()}`}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0056D2' }}>Contact seller</span>
                        <span style={{ fontSize: '11px', color: '#999' }}>{product.category}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>By {getCreatorDisplayLabel(product)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#FF8C00', fontSize: '12px' }}>
                        {'⭐'.repeat(Math.round(product.rating || 0))}
                        <span style={{ color: '#999', marginLeft: '4px' }}>({product.reviewCount || 0} reviews)</span>
                      </div>
                    </div>
                  </Link>

                  <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'transparent' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleInquiryClick(product);
                        }}
                        style={{
                          flex: 1,
                          minWidth: '120px',
                          padding: '10px',
                          background: '#ff8c00',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '13px'
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 12h16" />
                            <path d="m13 5 7 7-7 7" />
                          </svg>
                          Inquiry
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewProfile(product);
                        }}
                        style={{
                          flex: 1,
                          minWidth: '120px',
                          padding: '10px',
                          background: '#ffffff',
                          color: '#111827',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '13px'
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 21a8 8 0 1 0-16 0" />
                            <circle cx="12" cy="8" r="4" />
                          </svg>
                          View Profile
                        </span>
                      </button>
                    </div>

                    {expandedReviews[product.id] && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <select
                          value={reviewDrafts[product.id] ?? 5}
                          onChange={(e) => {
                            e.stopPropagation();
                            setReviewDrafts((prev) => ({ ...prev, [product.id]: Number(e.target.value) }));
                          }}
                          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '13px' }}
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>{value} Star{value > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSubmitReview(product);
                          }}
                          style={{ padding: '8px 12px', background: '#FF8C00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
                        >
                          Submit Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      <style jsx>{`
        .feedLayout {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
        }
        .feedSidebar {
          flex: 0 0 240px;
          position: sticky;
          top: 120px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: white;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          max-height: calc(100vh - 140px);
          overflow-y: auto;
          box-sizing: border-box;
        }
        .feedMain {
          flex: 1;
          min-width: 0;
        }
        .feedGroup {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .feedLabel {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .feedCats {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .feedCatBtn {
          padding: 10px 14px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          width: 100%;
          transition: background-color 200ms;
        }
        @media (max-width: 900px) {
          .feedLayout {
            flex-direction: column;
            padding: 12px;
          }
          .feedSidebar {
            position: static;
            flex: none;
            width: 100%;
            max-height: none;
          }
          .feedCats {
            flex-direction: row;
            flex-wrap: wrap;
          }
          .feedCatBtn {
            width: auto;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link href="/feed" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📦</span>
          <span>Feed</span>
        </Link>
        <Link href="/messages" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px', position: 'relative' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px', position: 'relative' }}>
            💬
            {unreadMessageCount > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-8px', minWidth: '16px', height: '16px', padding: '0 4px', borderRadius: '999px', backgroundColor: '#ef4444', color: 'white', fontSize: '10px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
              </span>
            )}
          </span>
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

      {/* Buy Modal */}
      {showBuyModal && selectedProduct && (
        <BuyModal
          product={selectedProduct}
          buyer={{ uid: user!.uid, name: user!.displayName, email: user!.email }}
          seller={selectedSeller}
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => {
            // Reload products or update state as needed
          }}
        />
      )}

      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.86)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveImage(null)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.18)',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
          <img
            src={activeImage.src}
            alt={activeImage.name}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading feed...</div>}>
      <FeedPageContent />
    </Suspense>
  );
}
