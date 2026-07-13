'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { orderService } from '@/lib/firebase-orders';
import { reviewService } from '@/lib/firebase-reviews';
import { messagingService } from '@/lib/firebase-messaging';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalRevenue: 0,
    averageRating: 0,
    reviewCount: 0,
    unreadMessages: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    loadAnalytics();
  }, [user, authLoading, router]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get orders
      const buyerOrders = await orderService.getBuyerOrders(user!.uid);
      const sellerOrders = await orderService.getSellerOrders(user!.uid);

      // Calculate revenue (sum of seller orders)
      const totalRevenue = sellerOrders.reduce((sum, order) => sum + order.totalPrice, 0);

      // Get reviews
      const reviews = await reviewService.getUserReviews(user!.uid);
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      // Get conversations
      const conversations = await messagingService.getConversations(user!.uid);
      const unreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

      setStats({
        totalOrders: buyerOrders.length,
        totalSales: sellerOrders.length,
        totalRevenue,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
        unreadMessages: unreadCount,
      });

      setRecentOrders([...buyerOrders, ...sellerOrders].slice(0, 5));
      setRecentReviews(reviews.slice(0, 5));
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'Inter, sans-serif' }}>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#F5F5F5',
        minHeight: '100vh',
      }}
    >
      <div style={{ marginBottom: '30px' }}>
        <Link href="/profile">
          <span style={{ color: '#0056D2', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>← Back to Profile</span>
        </Link>
      </div>

      <h1 style={{ color: '#0056D2', marginBottom: '30px', fontSize: '28px' }}>📊 Analytics</h1>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard
          icon="🛒"
          label="Total Orders"
          value={stats.totalOrders}
          color="#FF8C00"
        />
        <StatCard
          icon="📦"
          label="Total Sales"
          value={stats.totalSales}
          color="#4CAF50"
        />
        <StatCard
          icon="💰"
          label="Total Revenue"
          value={`AED ${stats.totalRevenue.toLocaleString()}`}
          color="#2196F3"
        />
        <StatCard
          icon="⭐"
          label="Avg Rating"
          value={`${stats.averageRating}`}
          color="#FFB300"
          subtitle={`${stats.reviewCount} reviews`}
        />
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
        {/* Recent Orders */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginTop: 0, marginBottom: '15px', color: '#333' }}>
            📦 Recent Orders
          </h2>
          {recentOrders.length === 0 ? (
            <p style={{ color: '#999', fontSize: '13px' }}>No recent orders</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  style={{
                    padding: '10px',
                    background: '#F9FAFB',
                    borderRadius: '6px',
                    fontSize: '12px',
                    borderLeft: '3px solid #0056D2',
                  }}
                >
                  <p style={{ margin: '0 0 3px 0', fontWeight: 600, color: '#333' }}>
                    {order.productName}
                  </p>
                  <p style={{ margin: '0 0 3px 0', color: '#666' }}>
                    Qty: {order.quantity} | AED {order.totalPrice.toLocaleString()}
                  </p>
                  <span style={{
                    padding: '2px 6px',
                    background: order.status === 'PENDING' ? '#FFF3E0' : '#E8F5E9',
                    color: order.status === 'PENDING' ? '#F57C00' : '#2E7D32',
                    borderRadius: '3px',
                    fontSize: '11px',
                  }}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link href="/orders">
            <span style={{ color: '#0056D2', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '10px', display: 'inline-block' }}>
              View All Orders →
            </span>
          </Link>
        </div>

        {/* Recent Reviews */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginTop: 0, marginBottom: '15px', color: '#333' }}>
            ⭐ Recent Reviews
          </h2>
          {recentReviews.length === 0 ? (
            <p style={{ color: '#999', fontSize: '13px' }}>No reviews yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentReviews.slice(0, 5).map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: '10px',
                    background: '#F9FAFB',
                    borderRadius: '6px',
                    fontSize: '12px',
                    borderLeft: '3px solid #FFB300',
                  }}
                >
                  <p style={{ margin: '0 0 3px 0', fontWeight: 600, color: '#333' }}>
                    {review.reviewerName}
                  </p>
                  <p style={{ margin: '0 0 3px 0', color: '#666' }}>
                    {'⭐'.repeat(review.rating)} ({review.rating}/5)
                  </p>
                  <p style={{ margin: '0', color: '#999', fontSize: '11px', maxHeight: '30px', overflow: 'hidden' }}>
                    "{review.text.substring(0, 50)}..."
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginTop: 0, marginBottom: '15px', color: '#333' }}>
          🔗 Quick Access
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          <QuickLink href="/feed" icon="📦" label="Browse Feed" />
          <QuickLink href="/network" icon="🤝" label="Network" />
          <QuickLink href="/messages" icon="💬" label="Messages" />
          <QuickLink href="/create-post" icon="➕" label="Create Post" />
          <QuickLink href="/orders" icon="📋" label="Orders" />
          <QuickLink href="/profile" icon="👤" label="Profile" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, subtitle }: any) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderTop: `4px solid ${color}`,
      }}
    >
      <p style={{ fontSize: '24px', margin: '0 0 8px 0' }}>{icon}</p>
      <p style={{ fontSize: '12px', color: '#999', margin: '0 0 5px 0' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 3px 0', color }}>{value}</p>
      {subtitle && <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

function QuickLink({ href, icon, label }: any) {
  return (
    <Link href={href}>
      <div
        style={{
          padding: '15px',
          background: '#F9FAFB',
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 200ms',
          textDecoration: 'none',
          color: 'inherit',
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = '#F0F7FF')}
        onMouseOut={(e) => (e.currentTarget.style.background = '#F9FAFB')}
      >
        <p style={{ fontSize: '24px', margin: '0 0 5px 0' }}>{icon}</p>
        <p style={{ fontSize: '12px', fontWeight: 600, margin: 0, color: '#333' }}>{label}</p>
      </div>
    </Link>
  );
}
