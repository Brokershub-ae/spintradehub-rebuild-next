'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { productService, userService } from '@/lib/firebase-service';
import { messagingService } from '@/lib/firebase-messaging';
import { wishlistService } from '@/lib/firebase-wishlist';
import { useToast } from '@/lib/toast-context';
import Link from 'next/link';
import ProductGallery from '@/components/ProductGallery';
import ProductSpecifications from '@/components/ProductSpecifications';
import { ViewedProductTracker } from '@/components/RecentlyViewed';
import { getProductImages } from '@/lib/product-details';

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params.slug as string;
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [commentText, setCommentText] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [selectedRating, setSelectedRating] = useState(5);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const normalizeComments = (comments: any[] = []) => {
    if (!Array.isArray(comments)) return [];
    return comments.filter(Boolean).sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
  };

  const getCreatorDisplayLabel = (item: any) => {
    const rawName = item?.creatorName || item?.userName || item?.creatorDisplayName || '';
    const rawId = item?.creatorId || item?.userId || item?.seller || '';
    const profileName = item?.profileName || item?.profile?.name || item?.profile?.username || '';

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

  const currentUserLiked = !!(user && product && Array.isArray(product.likedBy) && product.likedBy.includes(user.uid));

  const handleAddToFavorites = async () => {
    if (!user || !product?.id) {
      addToast({ type: 'warning', title: 'Login required', message: 'Please sign in to save this post.' });
      return;
    }

    try {
      const targetProductId = product.id || productId;

      if (isFavorite && wishlistId) {
        await wishlistService.removeFromWishlist(wishlistId);
        setIsFavorite(false);
        setWishlistId(null);
        addToast({ type: 'success', title: 'Removed', message: 'This post was removed from your wishlist.' });
        return;
      }

      const newWishlistId = await wishlistService.addToWishlist(
        user.uid,
        targetProductId,
        product.productName || 'Untitled post',
        String(product.price ?? ''),
        product.creatorName || 'Seller',
        product.creatorId || product.userId || product.seller || '',
        product.imageUri || ''
      );

      setIsFavorite(true);
      setWishlistId(newWishlistId);
      addToast({ type: 'success', title: 'Saved', message: 'This post was added to your wishlist.' });
    } catch (error) {
      console.error('Unable to update wishlist:', error);
      addToast({ type: 'error', title: 'Error', message: 'Unable to save this post to your wishlist. Please try again.' });
    }
  };

  const handleToggleLike = async () => {
    if (!user || !product || !product.id) return;

    try {
      setIsSubmittingAction(true);
      const currentLiked = Array.isArray(product.likedBy) && product.likedBy.includes(user.uid);
      const nextLikedBy = currentLiked
        ? (product.likedBy || []).filter((id: string) => id !== user.uid)
        : [...(product.likedBy || []), user.uid];

      const nextLikes = Math.max(0, Number(product.likes || 0) + (currentLiked ? -1 : 1));

      await productService.updatePost(product.id, {
        likedBy: nextLikedBy,
        likes: nextLikes,
      });

      setProduct((prev: any) => prev ? { ...prev, likedBy: nextLikedBy, likes: nextLikes } : prev);
      
      if (!currentLiked) {
        setIsAnimatingLike(true);
        setTimeout(() => setIsAnimatingLike(false), 800);
      }
      
      addToast({ type: 'success', title: currentLiked ? 'Like removed' : 'Post liked', message: currentLiked ? 'Your like was removed.' : 'You liked this post.' });
    } catch (error) {
      console.error('Unable to update like count:', error);
      addToast({ type: 'error', title: 'Error', message: 'Unable to update the like count. Please try again.' });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !product || !product.id) return;

    const trimmedComment = commentText.trim();
    if (!trimmedComment) {
      addToast({ type: 'warning', title: 'Comment empty', message: 'Write a comment before posting.' });
      return;
    }

    try {
      setIsSubmittingAction(true);
      const existingComments = normalizeComments(product.comments || []);
      const newComment = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        user: user.displayName || user.email || 'User',
        userId: user.uid,
        text: trimmedComment,
        timestamp: Date.now(),
      };

      const nextComments = [newComment, ...existingComments];
      await productService.updatePost(product.id, { comments: nextComments });
      setProduct((prev: any) => prev ? { ...prev, comments: nextComments } : prev);
      setCommentText('');
      addToast({ type: 'success', title: 'Comment posted', message: 'Your comment is now visible below the post.' });
    } catch (error) {
      console.error('Unable to save comment:', error);
      addToast({ type: 'error', title: 'Error', message: 'Unable to post the comment. Please try again.' });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSharePost = async () => {
    if (!product) return;

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/${product.id}` : `/${product.id}`;
    const shareText = `Check this post on SpinTradeHub: ${product.productName}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: product.productName, text: shareText, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      } else if (typeof window !== 'undefined') {
        window.prompt('Copy this post link:', `${shareText} ${shareUrl}`);
      }

      const nextShares = Number(product.shares || 0) + 1;
      if (product.id) {
        await productService.updatePost(product.id, { shares: nextShares });
        setProduct((prev: any) => prev ? { ...prev, shares: nextShares } : prev);
      }

      addToast({ type: 'success', title: 'Post shared', message: 'The share link has been copied or shared successfully.' });
    } catch (error) {
      console.error('Share action failed:', error);
      addToast({ type: 'warning', title: 'Share canceled', message: 'The share action was canceled or unavailable.' });
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !product || !product.id) return;

    try {
      setIsSubmittingAction(true);
      const currentRating = Number(product.rating || 0);
      const currentReviewCount = Number(product.reviewCount || 0);
      const nextReviewCount = currentReviewCount + 1;
      const nextAverage = ((currentRating * currentReviewCount) + selectedRating) / nextReviewCount;

      await productService.updatePost(product.id, {
        rating: Number(nextAverage.toFixed(1)),
        reviewCount: nextReviewCount,
      });

      setProduct((prev: any) => prev ? { ...prev, rating: Number(nextAverage.toFixed(1)), reviewCount: nextReviewCount } : prev);
      setReviewText('');
      setSelectedRating(5);
      setShowReviewForm(false);
      addToast({ type: 'success', title: 'Review submitted', message: 'Your review has been added to this post.' });
    } catch (error) {
      console.error('Unable to save review:', error);
      addToast({ type: 'error', title: 'Error', message: 'Unable to save your review. Please try again.' });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (authLoading) return;
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const post = await productService.getPostById(productId);
        if (!post) {
          setProduct(null);
          setLoading(false);
          return;
        }

        const creatorId = post.creatorId || post.userId || (post as any).creator || (post as any).seller;
        const seller = creatorId ? await userService.getUserProfile(creatorId) : null;
        const enrichedProduct = {
          ...post,
          creatorId,
          userId: creatorId || post.userId,
          creatorName: post.creatorName || seller?.name || seller?.username || 'User',
          profileName: seller?.name || seller?.username || '',
          profile: seller || null,
          rating: Number(post.rating ?? 0),
          reviewCount: Number(post.reviewCount ?? 0),
          likes: Number(post.likes ?? 0),
          shares: Number(post.shares ?? 0),
          comments: normalizeComments(post.comments || []),
          likedBy: Array.isArray(post.likedBy) ? post.likedBy : [],
          price: post.price ?? '0',
          imageUri: post.imageUri || post.imageUrl || post.photo || '',
          supplier: seller ? {
            name: seller.name || seller.username || 'Seller',
            rating: 4.5,
            reviews: 0,
            responseTime: '< 2 hours',
            verified: true,
          } : undefined,
        };

        setProduct(enrichedProduct);

        if (user?.uid) {
          const existingWishlistId = await wishlistService.isInWishlist(user.uid, enrichedProduct.id || productId);
          setIsFavorite(Boolean(existingWishlistId));
          setWishlistId(existingWishlistId);
        }
      } catch (error) {
        console.error('Failed to load product details:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [authLoading, user, router, productId]);

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push('/login');
      return;
    }

    const trimmedMessage = inquiryMessage.trim();
    if (!trimmedMessage) {
      addToast({ type: 'error', title: 'Missing message', message: 'Please write your inquiry before sending.' });
      return;
    }

    try {
      const sellerId = product?.creatorId || product?.userId;
      const sellerName = product?.creatorName || 'Seller';
      if (!sellerId) {
        addToast({ type: 'error', title: 'Error', message: 'Seller information not available.' });
        return;
      }

      const productContext = {
        productId: product.id,
        productName: product.productName || 'Untitled post',
        description: product.description || product.fullDescription || 'No description provided',
        category: product.category || 'Uncategorized',
        sellerName,
        sellerId,
        quantity: product.quantity ? Number(product.quantity) : undefined,
        location: product.location || '',
        notes: trimmedMessage,
        postUrl: product.id ? `/${product.id}` : '/feed',
      };

      await messagingService.sendMessage(
        user.uid,
        user.displayName || user.email || 'Buyer',
        sellerId,
        sellerName,
        `Product inquiry for ${product.productName}: ${trimmedMessage}`,
        undefined,
        productContext
      );

      addToast({ type: 'success', title: 'Inquiry sent', message: `Your message was sent to ${sellerName}.` });
      setShowInquiryForm(false);
      setInquiryMessage('');
    } catch (error) {
      console.error('Error sending inquiry:', error);
      addToast({ type: 'error', title: 'Error', message: 'Failed to send inquiry. Please try again.' });
    }
  };

  if (authLoading || loading) {
    return <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!product) {
    return <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Product not found</div>;
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      <ViewedProductTracker id={product.id || productId} postType={product.postType} />
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ padding: '16px' }}>
          <Link href="/feed" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white', fontSize: '14px' }}>
            <span>←</span> Back to Feed
          </Link>
        </div>
      </header>

      <div style={{ padding: '16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <ProductGallery key={product.id || productId} images={getProductImages(product)} name={product.productName} />
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToFavorites();
              }}
              style={{ position: 'absolute', top: '12px', right: '12px', width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'white', border: 'none', cursor: 'pointer', fontSize: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isFavorite ? '🔖' : '🔖'}
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'inline-block', backgroundColor: '#E3F2FD', color: '#0056D2', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', marginBottom: '8px' }}>
                  {product.category}
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#333', margin: '0 0 8px 0' }}>{product.productName}</h1>
                <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Posted {new Date(product.timestamp).toLocaleDateString()}</p>
                <ProductSpecifications product={product} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E0E0E0' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#0056D2', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                {product.creatorName.charAt(0)}
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#333', margin: 0 }}>{getCreatorDisplayLabel(product)}</p>
                <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0 0' }}>⭐ {product.rating} ({product.reviewCount} reviews)</p>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', marginBottom: '16px' }}>
              {String(product.description || '').split('\n').filter(Boolean).map((line: string, index: number) => (
                <div key={`${product.id}-${index}`} style={{ marginBottom: '6px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#0056D2', fontWeight: '700', lineHeight: '1.4' }}>•</span>
                  <span style={{ flex: 1 }}>{line.trim()}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '16px', padding: '10px 12px', backgroundColor: '#F9FAFB', borderRadius: '12px', color: '#374151', fontSize: '12px', fontWeight: '600' }}>
              <span>{Number(product.likes || 0)} likes</span>
              <span>{Number(product.shares || 0)} shares</span>
              <span>⭐ {Number(product.rating || 0).toFixed(1)} / 5</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '16px' }}>
              <button onClick={handleToggleLike} disabled={isSubmittingAction} style={{ padding: '12px 10px', border: 'none', borderRadius: '8px', cursor: isSubmittingAction ? 'not-allowed' : 'pointer', backgroundColor: 'white', color: currentUserLiked ? '#D93025' : '#374151', fontSize: '14px', fontWeight: '800', transition: 'transform 0.2s', transform: isAnimatingLike ? 'scale(1.2)' : 'scale(1)', animation: isAnimatingLike ? 'bounce 0.8s ease' : 'none' }}>
                {currentUserLiked ? '♥ Liked' : '♡ Like'}
              </button>
              <button onClick={() => setShowReviewForm((prev) => !prev)} style={{ padding: '12px 10px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'white', color: '#0056D2', fontSize: '14px', fontWeight: '800' }}>
                ⭐ Review
              </button>
              <button onClick={handleSharePost} style={{ padding: '12px 10px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'white', color: '#0E8A5B', fontSize: '14px', fontWeight: '800' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 12h8" />
                    <path d="m12 8 4 4-4 4" />
                    <path d="M6 6v12" />
                  </svg>
                  Share
                </span>
              </button>
            </div>

            {showReviewForm && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setSelectedRating(star)} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: star <= selectedRating ? '#FFB400' : '#D1D5DB' }}>
                      ★
                    </button>
                  ))}
                </div>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Write a quick review for this product" style={{ minHeight: '80px', borderRadius: '8px', border: '1px solid #E0E0E0', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit' }} />
                <button onClick={handleSubmitReview} disabled={isSubmittingAction} style={{ alignSelf: 'flex-end', padding: '10px 16px', border: 'none', borderRadius: '8px', cursor: isSubmittingAction ? 'not-allowed' : 'pointer', backgroundColor: '#0056D2', color: 'white', fontWeight: '600' }}>
                  Submit Review
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
              {!showInquiryForm && (
                <>
                  <button onClick={() => setShowInquiryForm(true)} style={{ padding: '12px 16px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }} onMouseOver={(e) => (e.currentTarget.style.background = '#E67E00')} onMouseOut={(e) => (e.currentTarget.style.background = '#FF8C00')}>
                    Send Inquiry
                  </button>
                  <button onClick={() => router.push('/messages')} style={{ padding: '12px 16px', backgroundColor: 'white', color: '#0056D2', border: '2px solid #0056D2', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    Message
                  </button>
                </>
              )}
            </div>

            {showInquiryForm && (
              <form onSubmit={handleSendInquiry} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <textarea placeholder="Your inquiry message" value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} required style={{ padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', minHeight: '80px', boxSizing: 'border-box' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button type="button" onClick={() => setShowInquiryForm(false)} style={{ padding: '10px 16px', backgroundColor: '#E0E0E0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#0056D2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    Send Inquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link href="/feed" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📦</span>
          <span>Feed</span>
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

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center py-12">Product not found</div>
        <Link href="/feed" className="text-blue-600 hover:underline text-center block">
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/feed" className="text-blue-600 hover:underline text-sm">
            ← Back to Feed
          </Link>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2">
          {/* Image */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
              {product.imageUri ? (
                <img
                  src={product.imageUri}
                  alt={product.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <p className="text-lg">No Image Available</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.productName}</h1>

            <div className="mb-6 pb-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold text-blue-600">${product.price}</span>
                  <p className="text-gray-600 text-sm">Minimum order: 10 units</p>
                </div>
                <span className={`px-4 py-2 rounded font-semibold ${
                  product.postType === 'SELL'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {product.postType}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-3">Overview</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{product.fullDescription}</p>
            </div>

            {/* Rating */}
            <div className="mb-6 pb-6 border-b">
              <h3 className="font-semibold mb-2">Rating & Reviews</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span className="text-xl font-bold">{product.rating}</span>
                <span className="text-gray-600">({product.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Supplier Info and Actions */}
        <div>
          {/* Supplier Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Seller Information</h2>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {product.supplier.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold">{product.supplier.name}</p>
                {product.supplier.verified && (
                  <p className="text-xs text-green-600">✓ Verified Seller</p>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rating</span>
                <span className="font-semibold">⭐ {product.supplier.rating}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Reviews</span>
                <span className="font-semibold">{product.supplier.reviews}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Response Time</span>
                <span className="font-semibold text-green-600">{product.supplier.responseTime}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!showInquiryForm ? (
                <>
                  <button
                    onClick={() => setShowInquiryForm(true)}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
                  >
                    Send Inquiry
                  </button>
                  <button
                    onClick={handleAddToFavorites}
                    className={`w-full px-4 py-3 font-semibold rounded transition ${
                      isFavorite
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isFavorite ? '🔖 Remove from Favorites' : '🔖 Add to Favorites'}
                  </button>
                  <Link
                    href={`/messages`}
                    className="w-full px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded hover:bg-gray-300 transition text-center block"
                  >
                    Message Seller
                  </Link>
                </>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-3">
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Write your inquiry or quote request..."
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
                    >
                      Send
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInquiryForm(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Product Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <span className="font-semibold">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Availability</span>
                <span className="font-semibold text-green-600">In Stock</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">Worldwide</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lead Time</span>
                <span className="font-semibold">5-7 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.35) rotate(-10deg); }
          75% { transform: scale(0.9) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
