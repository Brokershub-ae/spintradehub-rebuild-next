'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { syncAuthUsersToFirestore, batchSyncUsersFromAuth } from '@/lib/firebase-sync-utils';
import Link from 'next/link';

export default function DataSyncPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSyncCurrentUser = async () => {
    setSyncing(true);
    setMessage('');
    try {
      await syncAuthUsersToFirestore();
      setMessage('✅ Current user synced to Firestore!');
      setSuccess(true);
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSuccess(false);
    } finally {
      setSyncing(false);
    }
  };

  const handleBatchSync = async () => {
    setSyncing(true);
    setMessage('');
    try {
      await batchSyncUsersFromAuth();
      setMessage('✅ All users synced to Firestore!');
      setSuccess(true);
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSuccess(false);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <Link href="/profile" style={{ color: '#0056D2', textDecoration: 'none', marginBottom: '20px', display: 'block' }}>
        ← Back to Profile
      </Link>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0056D2', marginBottom: '8px' }}>Firebase Data Sync</h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>Sync user data between Firebase Auth and Firestore for app-web integration</p>

        <div style={{ backgroundColor: '#f5f5f5', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: 0, marginBottom: '12px' }}>Current Status:</h3>
          <p style={{ color: '#666', margin: '0' }}>
            <strong>Logged in as:</strong> {user.email}
          </p>
          <p style={{ color: '#666', margin: '8px 0 0 0' }}>
            <strong>User ID:</strong> {user.uid}
          </p>
        </div>

        <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
          <button
            onClick={handleSyncCurrentUser}
            disabled={syncing}
            style={{
              backgroundColor: '#0056D2',
              color: 'white',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: syncing ? 'not-allowed' : 'pointer',
              opacity: syncing ? 0.6 : 1,
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => !syncing && (e.currentTarget.style.backgroundColor = '#003ba6')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0056D2')}
          >
            {syncing ? '⏳ Syncing...' : '✓ Sync Current User'}
          </button>

          <button
            onClick={handleBatchSync}
            disabled={syncing}
            style={{
              backgroundColor: '#FF8C00',
              color: 'white',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: syncing ? 'not-allowed' : 'pointer',
              opacity: syncing ? 0.6 : 1,
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => !syncing && (e.currentTarget.style.backgroundColor = '#e07800')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FF8C00')}
          >
            {syncing ? '⏳ Syncing...' : '✓ Sync All Users'}
          </button>
        </div>

        {message && (
          <div style={{
            backgroundColor: success ? '#d4edda' : '#f8d7da',
            color: success ? '#155724' : '#721c24',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: `1px solid ${success ? '#c3e6cb' : '#f5c6cb'}`,
          }}>
            {message}
          </div>
        )}

        <div style={{
          backgroundColor: '#e7f3ff',
          borderLeft: '4px solid #0056D2',
          padding: '16px',
          borderRadius: '4px',
          color: '#004085',
          fontSize: '14px',
          lineHeight: '1.6',
        }}>
          <strong>ℹ️ What this does:</strong>
          <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
            <li>Creates your profile in Firestore if it doesn't exist</li>
            <li>Syncs your Firebase Auth data to the 'users' collection</li>
            <li>Makes your profile visible to other users on the Network page</li>
            <li>Enables full app-web synchronization</li>
          </ul>
        </div>

        <p style={{ fontSize: '12px', color: '#999', marginTop: '24px', textAlign: 'center' }}>
          After syncing, go to Network to see all synced users.
        </p>
      </div>
    </div>
  );
}
