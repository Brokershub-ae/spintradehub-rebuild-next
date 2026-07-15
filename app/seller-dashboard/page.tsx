'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { orderService } from '@/lib/firebase-orders';
import { productService } from '@/lib/firebase-service';
import { reviewService } from '@/lib/firebase-reviews';
import Link from 'next/link';

interface SaleData {
  totalRevenue: number;
  totalOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: any[];
  avgRating: number;
  totalReviews: number;
}

export default function SellerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [saleData, setSaleData] = useState<SaleData>({
    totalRevenue: 0,
    totalOrders: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    recentOrders: [],
    avgRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    loadSellerData();
  }, [user, authLoading, router]);

  const loadSellerData = async () => {
    try {
      setLoading(true);

      // Get seller's orders
      const orders = await orderService.getSellerOrders(user!.uid);

      // Calculate metrics
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED').length;
      const shippedOrders = orders.filter((o) => o.status === 'SHIPPED').length;
      const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
      const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      // Get seller's products
      const products = await productService.getPostsByCreator(user!.uid);

      // Group orders by product to find top sellers
      const productSales = new Map<string, { sales: number; revenue: number }>();
      orders.forEach((order) => {
        const existing = productSales.get(order.productId) || { sales: 0, revenue: 0 };
        productSales.set(order.productId, {
          sales: existing.sales + order.quantity,
          revenue: existing.revenue + order.totalPrice,
        });
      });

      const topProducts = products
        .filter((p) => p.id) // Filter out items without id
        .map((p) => {
          const sales = productSales.get(p.id!) || { sales: 0, revenue: 0 };
          return {
            name: p.productName,
            sales: sales.sales,
            revenue: sales.revenue,
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Get seller rating
      const rating = await reviewService.getUserAverageRating(user!.uid);

      setSaleData({
        totalRevenue,
        totalOrders: orders.length,
        confirmedOrders,
        shippedOrders,
        deliveredOrders,
        pendingOrders,
        averageOrderValue,
        topProducts,
        recentOrders: orders.slice(-5),
        avgRating: rating.avg,
        totalReviews: rating.count,
      });
    } catch (error) {
      console.error('Error loading seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'Inter, sans-serif' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '1400px',
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

      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0056D2', margin: '0 0 8px 0' }}>
        📊 Seller Dashboard
      </h1>
      <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
        Track your sales, orders, and performance metrics
      </p>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          {
            label: 'Total Revenue',
            value: `AED ${saleData.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
            icon: '💰',
            color: '#10B981',
          },
          {
            label: 'Total Orders',
            value: saleData.totalOrders.toString(),
            icon: '📦',
            color: '#0056D2',
          },
          {
            label: 'Avg Order Value',
            value: `AED ${saleData.averageOrderValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
            icon: '💵',
            color: '#FF8C00',
          },
          {
            label: 'Avg Rating',
            value: saleData.avgRating.toFixed(1),
            icon: '⭐',
            color: '#FFB300',
          },
        ].map((metric, i) => (
          <div
            key={i}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${metric.color}`,
            }}
          >
            <p style={{ fontSize: '12px', color: '#999', margin: '0 0 8px 0', fontWeight: 600 }}>
              {metric.label}
            </p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: metric.color, margin: 0 }}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Order Status Overview */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: '0 0 16px 0' }}>
          📈 Order Status Overview
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Pending', value: saleData.pendingOrders, color: '#FFA500' },
            { label: 'Confirmed', value: saleData.confirmedOrders, color: '#4CAF50' },
            { label: 'Shipped', value: saleData.shippedOrders, color: '#2196F3' },
            { label: 'Delivered', value: saleData.deliveredOrders, color: '#8BC34A' },
          ].map((status, i) => (
            <div
              key={i}
              style={{
                padding: '16px',
                background: '#F5F5F5',
                borderRadius: '8px',
                textAlign: 'center',
                borderLeft: `4px solid ${status.color}`,
              }}
            >
              <p style={{ fontSize: '12px', color: '#666', margin: 0, marginBottom: '8px' }}>
                {status.label}
              </p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: status.color, margin: 0 }}>
                {status.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: '0 0 16px 0' }}>
          🏆 Top 5 Products
        </h2>
        {saleData.topProducts.length === 0 ? (
          <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>No sales yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {saleData.topProducts.map((product, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 80px 100px',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#F5F5F5',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: '#0056D2',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '18px',
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: 0 }}>
                    {product.name}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px 0' }}>Sales</p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#0056D2', margin: 0 }}>
                    {product.sales}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px 0' }}>Revenue</p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#FF8C00', margin: 0 }}>
                    AED {product.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: '0 0 16px 0' }}>
          📋 Recent Orders
        </h2>
        {saleData.recentOrders.length === 0 ? (
          <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>No orders yet</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E0E0E0' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: '600', color: '#666' }}>
                    Order ID
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: '600', color: '#666' }}>
                    Product
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', fontSize: '12px', fontWeight: '600', color: '#666' }}>
                    Qty
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', fontWeight: '600', color: '#666' }}>
                    Amount
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', fontSize: '12px', fontWeight: '600', color: '#666' }}>
                    Status
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', fontSize: '12px', fontWeight: '600', color: '#666' }}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {saleData.recentOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#0056D2', fontWeight: '600' }}>
                      #{order.id?.substring(0, 8)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#333' }}>
                      {order.productName}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
                      {order.quantity}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#FF8C00',
                      }}
                    >
                      AED {order.totalPrice}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          background:
                            order.status === 'PENDING'
                              ? '#FFF3E0'
                              : order.status === 'CONFIRMED'
                                ? '#E8F5E9'
                                : order.status === 'SHIPPED'
                                  ? '#E3F2FD'
                                  : '#F1F8E9',
                          color:
                            order.status === 'PENDING'
                              ? '#FFA500'
                              : order.status === 'CONFIRMED'
                                ? '#4CAF50'
                                : order.status === 'SHIPPED'
                                  ? '#2196F3'
                                  : '#8BC34A',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
