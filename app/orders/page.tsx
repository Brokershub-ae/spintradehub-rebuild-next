'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { orderService, Order } from '@/lib/firebase-orders';
import Link from 'next/link';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    loadOrders();
  }, [user, authLoading, router]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const [purchases, sales] = await Promise.all([
        orderService.getBuyerOrders(user!.uid),
        orderService.getSellerOrders(user!.uid),
      ]);
      setBuyerOrders(purchases);
      setSellerOrders(sales);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFA500';
      case 'CONFIRMED':
        return '#4CAF50';
      case 'SHIPPED':
        return '#2196F3';
      case 'DELIVERED':
        return '#8BC34A';
      case 'CANCELLED':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFF3E0';
      case 'CONFIRMED':
        return '#E8F5E9';
      case 'SHIPPED':
        return '#E3F2FD';
      case 'DELIVERED':
        return '#F1F8E9';
      case 'CANCELLED':
        return '#FFEBEE';
      default:
        return '#F5F5F5';
    }
  };

  if (authLoading || loading) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <p>Loading orders...</p>
      </div>
    );
  }

  const orders = activeTab === 'purchases' ? buyerOrders : sellerOrders;

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ marginBottom: '30px' }}>
        <Link href="/profile">
          <span style={{ color: '#0056D2', cursor: 'pointer' }}>← Back to Profile</span>
        </Link>
      </div>

      <h1 style={{ color: '#0056D2', marginBottom: '30px', fontSize: '28px' }}>
        📦 Orders
      </h1>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <button
          onClick={() => setActiveTab('purchases')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'purchases' ? '#0056D2' : 'transparent',
            color: activeTab === 'purchases' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '4px 4px 0 0',
          }}
        >
          💳 My Purchases ({buyerOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'sales' ? '#0056D2' : 'transparent',
            color: activeTab === 'sales' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '4px 4px 0 0',
          }}
        >
          📊 My Sales ({sellerOrders.length})
        </button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: '#F5F5F5',
            borderRadius: '8px',
            color: '#999',
          }}
        >
          <p>No {activeTab === 'purchases' ? 'purchase' : 'sales'} orders yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                background: 'white',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: '20px',
                alignItems: 'center',
              }}
            >
              {/* Product */}
              <div>
                <p style={{ fontSize: '12px', color: '#999', margin: '0 0 5px 0' }}>
                  Product
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    margin: '0',
                    color: '#0056D2',
                  }}
                >
                  {order.productName}
                </p>
              </div>

              {/* Quantity & Price */}
              <div>
                <p style={{ fontSize: '12px', color: '#999', margin: '0 0 5px 0' }}>
                  Quantity
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    margin: '0',
                  }}
                >
                  {order.quantity} units @ AED {order.pricePerUnit}
                </p>
              </div>

              {/* Total */}
              <div>
                <p style={{ fontSize: '12px', color: '#999', margin: '0 0 5px 0' }}>
                  Total
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    margin: '0',
                    color: '#FF8C00',
                  }}
                >
                  AED {order.totalPrice.toLocaleString()}
                </p>
              </div>

              {/* Status */}
              <div>
                <p style={{ fontSize: '12px', color: '#999', margin: '0 0 5px 0' }}>
                  Status
                </p>
                <span
                  style={{
                    padding: '6px 12px',
                    background: getStatusBg(order.status),
                    color: getStatusColor(order.status),
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {order.status}
                </span>
              </div>

              {/* More Details */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #F0F0F0', paddingTop: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', fontSize: '12px' }}>
                  <div>
                    <p style={{ color: '#999', margin: '0 0 3px 0' }}>
                      {activeTab === 'purchases' ? 'Seller' : 'Buyer'}
                    </p>
                    <p style={{ margin: '0', fontWeight: 500 }}>
                      {activeTab === 'purchases' ? order.sellerName : order.buyerName}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#999', margin: '0 0 3px 0' }}>Ordered</p>
                    <p style={{ margin: '0', fontWeight: 500 }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#999', margin: '0 0 3px 0' }}>Delivery Address</p>
                    <p style={{ margin: '0', fontWeight: 500 }}>
                      {order.deliveryAddress || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#999', margin: '0 0 3px 0' }}>Notes</p>
                    <p style={{ margin: '0', fontWeight: 500 }}>
                      {order.notes || 'None'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
