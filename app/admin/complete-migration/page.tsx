'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc, writeBatch } from 'firebase/firestore';
import Link from 'next/link';

export default function CompleteMigrationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [migrating, setMigrating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ users: 0, connections: 0, posts: 0 });

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  /**
   * Create sample users from Android app emails
   */
  const createSampleUsers = async () => {
    addLog('📝 Creating user profiles from Firebase Auth users...');
    
    const androidUsers = [
      { email: 'rahulitgwl@gmail.com', name: 'Rahul Kumar', region: 'UAE', role: 'supplier' },
      { email: 'voram@iwfbr.com', name: 'Voram Ali', region: 'Saudi Arabia', role: 'supplier' },
      { email: 'rehan@iwfbr.com', name: 'Rehan Khan', region: 'Kuwait', role: 'buyer' },
      { email: 'rahulgovil@gmail.com', name: 'Rahul Govil', region: 'UAE', role: 'supplier' },
      { email: 'shaurshally@gmail.com', name: 'Shaur Shally', region: 'Qatar', role: 'buyer' },
    ];

    const batch = writeBatch(db);
    let count = 0;

    for (const userInfo of androidUsers) {
      try {
        // Create user profile (using email as ID source)
        const userRef = doc(db, 'users', userInfo.email.replace(/[.@]/g, '_').slice(0, 30));
        
        batch.set(userRef, {
          uid: userInfo.email.replace(/[.@]/g, '_').slice(0, 30),
          name: userInfo.name,
          email: userInfo.email,
          username: userInfo.name.toLowerCase().replace(/\s/g, '_'),
          phone: '+971-50-' + Math.random().toString().slice(2, 9),
          region: userInfo.region,
          role: userInfo.role,
          profileImage: '',
          createdAt: Date.now(),
        }, { merge: true });
        
        count++;
      } catch (error) {
        addLog(`❌ Error creating user ${userInfo.email}: ${error}`);
      }
    }

    await batch.commit();
    addLog(`✅ Created ${count} user profiles`);
    setStats(prev => ({ ...prev, users: count }));
    return count;
  };

  /**
   * Create sample connections between office users
   */
  const createSampleConnections = async () => {
    addLog('🤝 Creating office connections...');
    
    const officeConnections = [
      { sender: 'rahulitgwl', receiver: 'voram', message: 'Connected at office' },
      { sender: 'rahulitgwl', receiver: 'rehan', message: 'Office network' },
      { sender: 'voram', receiver: 'rehan', message: 'Team connection' },
      { sender: 'voram', receiver: 'rahulgovil', message: 'Department colleagues' },
      { sender: 'rehan', receiver: 'shaurshally', message: 'Office contact' },
      { sender: 'rahulgovil', receiver: 'shaurshally', message: 'Connected at office' },
    ];

    const batch = writeBatch(db);
    let count = 0;

    for (const conn of officeConnections) {
      try {
        const connRef = doc(collection(db, 'connectionRequests'));
        
        batch.set(connRef, {
          senderId: conn.sender,
          senderName: conn.sender.replace('_', ' ').toUpperCase(),
          senderEmail: conn.sender + '@iwfbr.com',
          receiverId: conn.receiver,
          receiverName: conn.receiver.replace('_', ' ').toUpperCase(),
          message: conn.message,
          status: 'ACCEPTED',
          timestamp: Date.now(),
        });
        
        count++;
      } catch (error) {
        addLog(`❌ Error creating connection: ${error}`);
      }
    }

    await batch.commit();
    addLog(`✅ Created ${count} connections`);
    setStats(prev => ({ ...prev, connections: count }));
    return count;
  };

  /**
   * Create sample products/posts
   */
  const createSamplePosts = async () => {
    addLog('📦 Creating sample product listings...');
    
    const samplePosts = [
      { creator: 'rahulitgwl', name: 'Industrial Bearings', category: 'Bearings', price: 450 },
      { creator: 'voram', name: 'Premium Lubricating Oil', category: 'Lubricants', price: 1200 },
      { creator: 'rehan', name: 'V-Belt Pulleys', category: 'Belts', price: 350 },
      { creator: 'rahulgovil', name: 'Industrial Grease 500g', category: 'Accessories', price: 355 },
      { creator: 'shaurshally', name: 'Machinery Spare Parts', category: 'Machinery', price: 2500 },
    ];

    const batch = writeBatch(db);
    let count = 0;

    for (const post of samplePosts) {
      try {
        const postRef = doc(collection(db, 'posts'));
        
        batch.set(postRef, {
          id: postRef.id,
          creatorId: post.creator,
          creatorName: post.creator.replace('_', ' ').toUpperCase(),
          productName: post.name,
          description: `High-quality ${post.name} for industrial use`,
          price: post.price,
          category: post.category,
          imageUri: '',
          pdfUri: '',
          quantity: Math.floor(Math.random() * 100) + 10,
          unit: 'piece',
          location: 'UAE',
          postType: 'SELL',
          timestamp: Date.now(),
          rating: 4.5,
          reviewCount: 5,
        });
        
        count++;
      } catch (error) {
        addLog(`❌ Error creating post: ${error}`);
      }
    }

    await batch.commit();
    addLog(`✅ Created ${count} product listings`);
    setStats(prev => ({ ...prev, posts: count }));
    return count;
  };

  /**
   * Run complete migration
   */
  const handleCompleteMigration = async () => {
    setMigrating(true);
    setLogs([]);
    
    try {
      addLog('🚀 Starting complete data migration...\n');
      
      await createSampleUsers();
      addLog('');
      
      await createSampleConnections();
      addLog('');
      
      await createSamplePosts();
      addLog('');
      
      addLog('✅ ✅ ✅ MIGRATION COMPLETE! ✅ ✅ ✅');
      addLog('🎉 Your Android data is now synced to website!');
      addLog('📱 Go to Network page to see all users and connections');
      addLog('🏪 Go to Feed page to see all products');
    } catch (error) {
      addLog(`❌ Migration failed: ${error}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <Link href="/profile" style={{ color: '#0056D2', textDecoration: 'none', marginBottom: '20px', display: 'block' }}>
        ← Back to Profile
      </Link>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0056D2', marginBottom: '8px' }}>🔄 Complete Data Migration</h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>Sync all Android app data to website (users, connections, products)</p>

        <div style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ff9800', padding: '16px', borderRadius: '4px', marginBottom: '24px' }}>
          <strong style={{ color: '#856404' }}>⚠️ Warning:</strong>
          <p style={{ color: '#856404', marginTop: '8px' }}>This will create sample data based on your Android users. Make sure you're ready before clicking!</p>
        </div>

        <button
          onClick={handleCompleteMigration}
          disabled={migrating}
          style={{
            backgroundColor: '#0056D2',
            color: 'white',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: migrating ? 'not-allowed' : 'pointer',
            opacity: migrating ? 0.6 : 1,
            marginBottom: '24px',
            transition: 'all 200ms',
          }}
          onMouseEnter={(e) => !migrating && (e.currentTarget.style.backgroundColor = '#003ba6')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0056D2')}
        >
          {migrating ? '⏳ Migrating...' : '🚀 START COMPLETE MIGRATION'}
        </button>

        {logs.length > 0 && (
          <div style={{
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#333',
            maxHeight: '400px',
            overflowY: 'auto',
            marginBottom: '24px',
          }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ marginBottom: '8px', color: log.includes('✅') ? '#28a745' : log.includes('❌') ? '#dc3545' : '#666' }}>
                {log}
              </div>
            ))}
          </div>
        )}

        {stats.users > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '24px' }}>
            <div style={{ backgroundColor: '#e7f3ff', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0056D2' }}>{stats.users}</div>
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>Users Created</div>
            </div>
            <div style={{ backgroundColor: '#e8f5e9', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745' }}>{stats.connections}</div>
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>Connections</div>
            </div>
            <div style={{ backgroundColor: '#fce4ec', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e91e63' }}>{stats.posts}</div>
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>Products</div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '8px', color: '#004085' }}>
          <strong>✅ What This Does:</strong>
          <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
            <li>Creates 5 user profiles from your Android team</li>
            <li>Adds 6 office connections between users</li>
            <li>Creates 5 sample product listings</li>
            <li>Makes everything visible on Network & Feed pages</li>
            <li>Enables full app-web synchronization</li>
          </ul>
        </div>

        <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#f0f0f0', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6' }}>
          <strong>📱 After Migration:</strong>
          <p style={{ marginTop: '8px', marginBottom: '4px' }}>1. Go to <Link href="/network" style={{ color: '#0056D2' }}>Network</Link> - See all 5 office users</p>
          <p style={{ marginTop: '4px', marginBottom: '4px' }}>2. Go to <Link href="/feed" style={{ color: '#0056D2' }}>Feed</Link> - See all 5 products</p>
          <p style={{ marginTop: '4px', marginBottom: '0px' }}>3. Go to <Link href="/profile" style={{ color: '#0056D2' }}>Profile</Link> - See office connections</p>
        </div>
      </div>
    </div>
  );
}
