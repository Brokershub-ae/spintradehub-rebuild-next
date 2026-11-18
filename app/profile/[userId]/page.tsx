'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { userService, connectionService, productService } from '@/lib/firebase-service';
import { notificationService } from '@/lib/firebase-notifications';
import { useToast } from '@/lib/toast-context';
import { reviewService, type UserRatingSummary } from '@/lib/firebase-reviews';
import Link from 'next/link';
import styles from './profile.module.css';

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { userId } = useParams();
  const router = useRouter();
  const { addToast } = useToast();

  const [profileData, setProfileData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingSummary, setRatingSummary] = useState<UserRatingSummary | null>(null);
  const [ratingsError, setRatingsError] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'pending' | 'none'>('none');

  useEffect(() => {
    if (authLoading || !user || typeof userId !== 'string') return;
    let cancelled = false;
    setRatingSummary(null);
    setRatingsError(false);
    reviewService.getUserAverageRating(userId).then((summary) => {
      if (!cancelled) setRatingSummary(summary);
    }).catch((error) => {
      console.error('Error loading user profile rating:', error);
      if (!cancelled) setRatingsError(true);
    });
    return () => { cancelled = true; };
  }, [user?.uid, authLoading, userId]);

  useEffect(() => {
    if (authLoading || !userId) return;

    if (!user) {
      router.push('/login');
      return;
    }

    loadUserProfile();
  }, [user, authLoading, userId, router]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await userService.getUserProfile(userId as string);
      setProfileData(profile);

      const posts = await productService.getPostsByCreator(userId as string);
      setUserPosts(posts);

      // Check connection status
      const allConnections = await connectionService.getUserConnectionRequests(user!.uid);
      const connection = allConnections.find(
        (c) =>
          (c.senderId === user!.uid && c.receiverId === userId as string) ||
          (c.senderId === userId as string && c.receiverId === user!.uid)
      );

      if (connection?.status === 'ACCEPTED') {
        setConnectionStatus('connected');
      } else if (connection?.status === 'PENDING') {
        setConnectionStatus('pending');
      } else {
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load user profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPostImageUrl = (post: any) => {
    return post?.imageUri || post?.imageUrl || post?.photo || post?.thumbnail || post?.photoUrl || post?.img || '';
  };

  const formatPostDate = (post: any) => {
    if (!post?.timestamp) return '';
    try {
      return new Date(post.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleSendConnection = async () => {
    if (!profileData) return;

    try {
      await connectionService.sendConnectionRequest({
        senderId: user!.uid,
        senderName: user!.displayName || user!.email || 'User',
        senderEmail: user!.email || '',
        receiverId: userId as string,
        receiverName: profileData.name || 'User',
        message: `Let's connect!`,
        timestamp: Date.now(),
        status: 'PENDING',
      });

      await notificationService.createNotification(
        userId as string,
        'CONNECTION',
        '🤝 New connection request',
        `${user!.displayName || user!.email || 'Someone'} sent you a connection request.`,
        '/network'
      );

      setConnectionStatus('pending');
      addToast({
        type: 'success',
        title: 'Connection Sent',
        message: `Connection request sent to ${profileData.name}`,
      });
    } catch (error) {
      console.error('Error sending connection:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to send connection request',
      });
    }
  };

  const handleMessage = () => {
    router.push(`/messages?user=${userId}`);
  };

  if (authLoading || loading) {
    return (
      <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif' }}>Loading profile...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>User not found</p>
          <Link href="/network" style={{ color: '#0056D2', textDecoration: 'none', fontWeight: '600' }}>
            ← Back to Network
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profileData?.name || 'User';
  const roleLabel = profileData?.role ? profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1) : 'Professional';
  const initials = (displayName || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() || '')
    .join('') || 'U';

  return (
    <div className={styles.page} style={{ background: 'linear-gradient(180deg, #f4f7fb 0%, #eef3f8 100%)', minHeight: '100vh', paddingBottom: '100px', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: 'linear-gradient(135deg, #0056D2 0%, #0b4fb4 100%)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className={styles.toolbar}>
          <Link href="/network" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white' }}>
            <span style={{ fontSize: '20px' }}>←</span>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'white' }}>Professional Profile</h1>
          </Link>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '600' }}>
            {userPosts.length} listings shared
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section style={{ background: 'white', borderRadius: '24px', boxShadow: '0 16px 35px rgba(15, 23, 42, 0.08)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div className={styles.hero} style={{ background: 'linear-gradient(135deg, #0b5ae8 0%, #0d4cb4 100%)' }}>
            <div className={styles.heroContent}>
              <div className={styles.identity}>
                <div style={{ width: '92px', height: '92px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff8c00 0%, #f97316 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', fontWeight: '900', border: '4px solid #f8fbff', boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)', flexShrink: 0 }}>
                  {initials}
                </div>

                <div className={styles.identityText}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 className={styles.name}>{displayName}</h2>
                    <span style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '999px', padding: '5px 10px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Verified
                    </span>
                  </div>
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.92)', margin: '8px 0 0', fontWeight: '600' }}>
                    {roleLabel}{profileData.region ? ` • ${profileData.region}` : ''}
                  </p>
                </div>
              </div>

              <div className={styles.badges}>
                <span style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', padding: '8px 12px', fontSize: '12px', fontWeight: '700' }}>
                  {userPosts.length} listings
                </span>
                <span style={{ background: 'rgba(34,197,94,0.12)', color: '#d1fae5', border: '1px solid rgba(134,239,172,0.4)', borderRadius: '999px', padding: '8px 12px', fontSize: '12px', fontWeight: '700' }}>
                  Open to connect
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: '18px 24px 22px', background: '#f9fafb', borderTop: '1px solid #edf2f7' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {connectionStatus === 'connected' ? (
                  <button
                    onClick={handleMessage}
                    style={{ padding: '11px 18px', backgroundColor: '#ff8c00', color: 'white', border: 'none', borderRadius: '999px', fontWeight: '800', cursor: 'pointer', fontSize: '14px', boxShadow: '0 10px 20px rgba(255, 140, 0, 0.2)' }}
                  >
                    💬 Message
                  </button>
                ) : connectionStatus === 'pending' ? (
                  <button disabled style={{ padding: '11px 18px', backgroundColor: '#e2e8f0', color: '#64748b', border: 'none', borderRadius: '999px', cursor: 'not-allowed', fontWeight: '700', fontSize: '14px' }}>
                    ⏳ Pending
                  </button>
                ) : (
                  <button
                    onClick={handleSendConnection}
                    style={{ padding: '11px 18px', backgroundColor: '#0056D2', color: 'white', border: 'none', borderRadius: '999px', fontWeight: '800', cursor: 'pointer', fontSize: '14px', boxShadow: '0 10px 20px rgba(0, 86, 210, 0.18)' }}
                  >
                    ➕ Connect
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={styles.stats}>
            {[
              { label: 'Role', value: roleLabel, icon: '💼' },
              { label: 'Location', value: profileData.region || 'Global', icon: '🌍' },
              { label: 'Activity', value: `${userPosts.length} posts`, icon: '📦' },
              { label: 'Rating', value: ratingsError ? 'Unavailable' : !ratingSummary ? 'Loading...' : ratingSummary.count > 0 ? `${ratingSummary.avg.toFixed(1)} (${ratingSummary.count} reviews)` : 'No reviews', icon: '⭐' },
              { label: 'Status', value: connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'pending' ? 'Request sent' : 'Available', icon: '✅' },
            ].map((item) => (
              <div key={item.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '12px 14px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>{item.label}</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{item.icon} {item.value}</div>
              </div>
            ))}
          </div>
          {ratingsError && <p role="alert" style={{ color: '#dc2626', padding: '0 24px 16px' }}>Unable to load this user&apos;s rating. Please refresh to try again.</p>}
        </section>

        <section className={styles.detailsGrid}>
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 12px 24px rgba(15, 23, 42, 0.05)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '18px' }}>🧭</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>About</h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#475569', margin: 0 }}>
              {profileData.email ? `Professional profile for ${displayName}.` : 'This profile is ready for business connections and product discovery.'}
              {profileData.role ? ` Specializes in ${roleLabel.toLowerCase()} opportunities.` : ''}
              {profileData.region ? ` Based in ${profileData.region}.` : ''}
            </p>
            <div style={{ marginTop: '16px', display: 'grid', gap: '10px' }}>
              {profileData.email && (
                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Contact</div>
                  <div style={{ fontSize: '14px', color: '#111827', fontWeight: '700', marginTop: '4px' }}>{profileData.email}</div>
                </div>
              )}
              {profileData.phone && (
                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Phone</div>
                  <div style={{ fontSize: '14px', color: '#111827', fontWeight: '700', marginTop: '4px' }}>{profileData.phone}</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 12px 24px rgba(15, 23, 42, 0.05)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '18px' }}>📈</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>Profile Snapshot</h3>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ padding: '12px', background: 'linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)', borderRadius: '14px', border: '1px solid #dbeafe' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Listings</div>
                <div style={{ fontSize: '20px', color: '#0056D2', fontWeight: '900', marginTop: '4px' }}>{userPosts.length}</div>
              </div>
              <div style={{ padding: '12px', background: 'linear-gradient(135deg, #fff7ed 0%, #fffaf2 100%)', borderRadius: '14px', border: '1px solid #fed7aa' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Visibility</div>
                <div style={{ fontSize: '20px', color: '#c2410c', fontWeight: '900', marginTop: '4px' }}>Open to trade</div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ background: 'white', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 12px 24px rgba(15, 23, 42, 0.05)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Recent activity</div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: '4px 0 0' }}>{displayName}&apos;s listings</h3>
            </div>
            <div style={{ color: '#0056D2', fontSize: '13px', fontWeight: '700' }}>{userPosts.length > 0 ? 'Updated recently' : 'No listings yet'}</div>
          </div>

          {userPosts.length === 0 ? (
            <div style={{ padding: '24px', border: '1px dashed #dbe4ee', borderRadius: '16px', color: '#64748b', textAlign: 'center', background: '#f8fafc' }}>
              No posts yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {userPosts.map((post) => {
                const imageUrl = getPostImageUrl(post);
                return (
                  <Link key={post.id} href={`/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={styles.listing} style={{ border: '1px solid #e5e7eb', borderRadius: '18px', overflow: 'hidden', background: '#fcfdff', boxShadow: '0 8px 18px rgba(15, 23, 42, 0.04)', transition: 'transform 180ms ease, box-shadow 180ms ease' }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 24px rgba(15, 23, 42, 0.08)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 18px rgba(15, 23, 42, 0.04)'; }}>
                      <div style={{ height: '100%', minHeight: '150px', background: '#f5f7fb', overflow: 'hidden' }}>
                        {imageUrl ? (
                          <img src={imageUrl} alt={post.productName || 'Post'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '8px', fontSize: '12px', fontWeight: '700' }}>
                            <span style={{ fontSize: '30px' }}>📦</span>
                            <span>{post.category || 'Product'}</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.listingBody}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ color: '#111827', fontSize: '16px' }}>{post.productName || 'Untitled post'}</strong>
                          <span style={{ fontSize: '11px', color: '#0056D2', fontWeight: '800', backgroundColor: 'rgba(0,86,210,0.08)', borderRadius: '999px', padding: '4px 8px' }}>{(post.category || 'Update').toString().slice(0, 20)}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>{post.description || 'No description provided.'}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: '#64748b' }}>
                          {post.location ? <span>📍 {post.location}</span> : null}
                          {formatPostDate(post) ? <span>• {formatPostDate(post)}</span> : null}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
