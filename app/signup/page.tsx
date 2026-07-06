'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/firebase-service';
import Link from 'next/link';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const countries = [
    'United Arab Emirates', 'India', 'USA', 'United Kingdom', 'Saudi Arabia',
    'Qatar', 'Oman', 'Kuwait', 'Germany', 'Singapore', 'Australia',
    'Canada', 'China', 'France', 'Japan', 'South Africa', 'Nigeria',
  ].sort();

  const roles = ['supplier', 'buyer'];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!fullName || !username || !email || !phone || !country || !role || !password) {
        throw new Error('Please fill in all fields');
      }

      await authService.signup(email, password, {
        name: fullName,
        username,
        email,
        phone,
        region: country,
        role: role as 'supplier' | 'buyer',
      });

      router.push('/feed');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' as const, outline: 'none' };
  
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
        <div style={{ width: '100%', maxWidth: '450px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0056D2', margin: 0 }}>Create Account</h1>
              <p style={{ fontSize: '12px', color: '#999', margin: '8px 0 0 0' }}>Join SpinTradeHub Today</p>
            </div>

            {error && <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#FFEBEE', borderRadius: '8px', color: '#C62828', fontSize: '12px' }}>{error}</div>}

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')} onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} required disabled={loading} />
              </div>

              <div>
                <label style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')} onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} required disabled={loading} />
              </div>

              <div>
                <label style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')} onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} required disabled={loading} />
              </div>

              <div>
                <label style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')} onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} required disabled={loading} />
              </div>

              <div>
                <label style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>Country/Region</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} required disabled={loading}>
                  <option value="">Select a country</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} required disabled={loading}>
                  <option value="">Select a role</option>
                  <option value="supplier">Supplier</option>
                  <option value="buyer">Buyer</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#333', fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = '#0056D2')} onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')} required disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>{showPassword ? '🙈' : '👁️'}</button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', backgroundColor: '#FF8C00', color: 'white', fontWeight: 'bold', padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', marginTop: '8px', opacity: loading ? 0.6 : 1 }} onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#E67E00')} onMouseOut={(e) => (e.currentTarget.style.background = '#FF8C00')}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: '#666', marginTop: '20px', fontSize: '12px' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#0056D2', textDecoration: 'none', fontWeight: '600' }}>Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
