'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/firebase-service';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(email, password);
      router.push('/feed');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#0056D2', boxShadow: '0 4px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: '100%', margin: '0 auto', padding: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white' }}>
            <span style={{ fontSize: '20px' }}>←</span>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'white' }}>Back</h1>
          </Link>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0056D2', margin: 0 }}>SpinTradeHub</h1>
              <p style={{ fontSize: '12px', color: '#999', margin: '8px 0 0 0' }}>B2B Industrial Trading</p>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '24px' }}>Login</h2>

            {error && (
              <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#FFEBEE', borderRadius: '8px', color: '#C62828', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 16px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Link href="/login" style={{ color: '#0056D2', textDecoration: 'none', fontSize: '12px', fontWeight: '500' }}>Forgot Password?</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', backgroundColor: '#FF8C00', color: 'white', fontWeight: 'bold', padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: loading ? 0.6 : 1 }}
                onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#E67E00')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#FF8C00')}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: '#666', marginTop: '24px', fontSize: '13px' }}>
              Don't have an account?{' '}
              <Link href="/signup" style={{ color: '#0056D2', textDecoration: 'none', fontWeight: '600' }}>Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
