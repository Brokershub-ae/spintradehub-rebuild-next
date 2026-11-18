'use client';

import { useState } from 'react';
import type { FormEvent, CSSProperties } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { submitPromotionRequest } from '@/lib/firebase-promotion-requests';
import type { PromotionRequestInput } from '@/lib/firebase-promotion-requests';

const initialDetails: PromotionRequestInput = {
  companyName: '', brandName: '', products: '', category: '', website: '',
  country: '', contactName: '', email: '', description: '',
};

const fields: Array<{
  name: keyof PromotionRequestInput;
  label: string;
  type?: 'text' | 'email' | 'url';
  multiline?: boolean;
  optional?: boolean;
}> = [
  { name: 'companyName', label: 'Company name' },
  { name: 'brandName', label: 'Brand name' },
  { name: 'products', label: 'Products you want to promote', multiline: true },
  { name: 'category', label: 'Category / industry' },
  { name: 'website', label: 'Website or product link', type: 'url', optional: true },
  { name: 'country', label: 'Country' },
  { name: 'contactName', label: 'Contact person' },
  { name: 'email', label: 'Business email', type: 'email' },
  { name: 'description', label: 'Tell us about your brand and promotion request', multiline: true },
];

const inputStyle: CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1',
  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit',
};

export default function PromotionRequestForm({ id }: { id: string }) {
  const { user, loading } = useAuth();
  const [details, setDetails] = useState(initialDetails);
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const savedId = await submitPromotionRequest(details);
      setRequestId(savedId);
      setDetails(initialDetails);
    } catch (cause) {
      console.error('Unable to submit promotion request:', cause);
      const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : '';
      setError(code === 'permission-denied'
        ? 'Your request could not be saved because access was denied. Please contact info@spintradehub.com or Customercare@spintradehub.com.'
        : cause instanceof Error ? cause.message : 'Your request could not be saved. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id={id} aria-labelledby={`${id}-heading`} style={{ scrollMarginTop: '100px' }}>
      <details>
        <summary style={{ cursor: 'pointer', color: '#0056D2', borderRadius: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Brand &amp; product promotion</span>
          <h2 id={`${id}-heading`} style={{ margin: '8px 0', color: '#111827', fontSize: '24px', fontWeight: '900' }}>List and promote your brand and products</h2>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>Click to open or close the promotion request form</span>
        </summary>
      <p style={{ color: '#475569', lineHeight: 1.6 }}>
        New to SpinTradeHub? Submit your brand and product details for a promotional listing on our website.
        Our team will review your request and contact you by email. Submission does not automatically publish a listing.
      </p>

      {loading ? (
        <p>Checking your account...</p>
      ) : !user ? (
        <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px' }}>
          <p style={{ marginTop: 0 }}>Create an account or sign in to submit your promotion request, then return to this form.</p>
          <Link href="/signup" style={{ color: '#0056D2', fontWeight: '800', marginRight: '20px' }}>Create an account</Link>
          <Link href="/login" style={{ color: '#0056D2', fontWeight: '800' }}>Sign in</Link>
        </div>
      ) : requestId ? (
        <div role="status" style={{ padding: '16px', background: '#ecfdf5', color: '#065f46', borderRadius: '12px' }}>
          <strong>Promotion request submitted for review.</strong>
          <p>Reference: {requestId}. Our team will contact you at your submitted business email.</p>
          <button type="button" onClick={() => setRequestId('')} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>Submit another request</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
          <fieldset disabled={submitting} style={{ padding: 0, margin: 0, border: 0, minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
              {fields.map((field) => (
                <div key={field.name} style={field.multiline ? { gridColumn: '1 / -1' } : undefined}>
                  <label htmlFor={`${id}-${field.name}`} style={{ display: 'block', color: '#334155', fontWeight: '600', fontSize: '13px', marginBottom: '6px' }}>
                    {field.label}{field.optional ? ' (optional)' : ' *'}
                  </label>
                  {field.multiline ? (
                    <textarea id={`${id}-${field.name}`} name={field.name} value={details[field.name]} required maxLength={2000} rows={3}
                      onChange={(event) => setDetails({ ...details, [field.name]: event.target.value })} style={inputStyle} />
                  ) : (
                    <input id={`${id}-${field.name}`} name={field.name} type={field.type || 'text'} value={details[field.name]} required={!field.optional} maxLength={254}
                      onChange={(event) => setDetails({ ...details, [field.name]: event.target.value })} style={inputStyle} />
                  )}
                </div>
              ))}
            </div>
            <button type="submit" style={{ marginTop: '18px', padding: '12px 20px', background: '#0056D2', color: 'white', border: 0, borderRadius: '10px', fontWeight: '800', cursor: submitting ? 'wait' : 'pointer' }}>
              {submitting ? 'Saving request...' : 'Submit promotion request'}
            </button>
          </fieldset>
        </form>
      )}
      </details>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: 0 }}>
        Questions? Email <a href="mailto:info@spintradehub.com">info@spintradehub.com</a> or <a href="mailto:Customercare@spintradehub.com">Customercare@spintradehub.com</a>.
      </p>
    </section>
  );
}
