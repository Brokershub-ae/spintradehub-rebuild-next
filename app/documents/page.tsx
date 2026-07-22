'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { commerceService, CommerceDoc } from '@/lib/firebase-service';
import { useToast } from '@/lib/toast-context';
import { userService } from '@/lib/firebase-service';
import Link from 'next/link';

const DOC_TYPES = ['QUOTATION', 'INVOICE', 'PURCHASE_BILL'] as const;
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#FFA500',
  ACCEPTED: '#4CAF50',
  REJECTED: '#F44336',
};
const TYPE_ICONS: Record<string, string> = {
  QUOTATION: '📋',
  INVOICE: '🧾',
  PURCHASE_BILL: '📑',
};

function generateDocNumber(type: string) {
  const prefix = type === 'QUOTATION' ? 'QT' : type === 'INVOICE' ? 'INV' : 'PB';
  return `${prefix}-${Date.now().toString().slice(-8)}`;
}

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [documents, setDocuments] = useState<CommerceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<CommerceDoc | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'QUOTATION' | 'INVOICE' | 'PURCHASE_BILL'>('all');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: 'QUOTATION' as 'QUOTATION' | 'INVOICE' | 'PURCHASE_BILL',
    receiverName: '',
    receiverEmail: '',
    currency: 'AED',
    notes: '',
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    loadDocuments();
  }, [user, authLoading, router]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await commerceService.getDocuments(user!.uid);
      docs.sort((a, b) => b.timestamp - a.timestamp);
      setDocuments(docs);
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load documents' });
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      items[index].total = Number(items[index].quantity) * Number(items[index].unitPrice);
    }
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }] });
  const removeItem = (i: number) => form.items.length > 1 && setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const totalAmount = form.items.reduce((sum, item) => sum + Number(item.total), 0);

  const handleCreate = async () => {
    if (!form.receiverName.trim()) {
      addToast({ type: 'warning', title: 'Missing Info', message: 'Enter recipient name' }); return;
    }
    if (form.items.some(i => !i.description.trim())) {
      addToast({ type: 'warning', title: 'Missing Items', message: 'Fill all item descriptions' }); return;
    }
    setSubmitting(true);
    try {
      await commerceService.createDocument({
        type: form.type,
        docNumber: generateDocNumber(form.type),
        date: Date.now(),
        senderId: user!.uid,
        senderName: user!.displayName || user!.email || 'User',
        receiverId: '',
        receiverName: form.receiverName,
        items: form.items.map(i => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), total: Number(i.total) })),
        totalAmount,
        currency: form.currency,
        status: 'PENDING',
        notes: form.notes,
        timestamp: Date.now(),
      });
      addToast({ type: 'success', title: 'Created!', message: `${form.type} created successfully` });
      setShowCreateModal(false);
      setForm({ type: 'QUOTATION', receiverName: '', receiverEmail: '', currency: 'AED', notes: '', dueDate: '', items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] });
      loadDocuments();
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', title: 'Error', message: 'Failed to create document' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (docId: string, status: string) => {
    try {
      await commerceService.updateDocumentStatus(docId, status);
      addToast({ type: 'success', title: 'Updated', message: `Status changed to ${status}` });
      if (viewingDoc) setViewingDoc({ ...viewingDoc, status: status as any });
      loadDocuments();
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to update status' });
    }
  };

  const handlePrint = (doc: CommerceDoc) => {
    const printContent = `
      <html><head><title>${doc.type} - ${doc.docNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #0056D2; padding-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #0056D2; }
        .doc-type { font-size: 22px; font-weight: bold; color: #FF8C00; }
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 20px 0; }
        .party h4 { color: #0056D2; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #0056D2; color: white; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #E0E0E0; }
        .total-row { font-weight: bold; font-size: 16px; background: #F5F5F5; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #FFA500; color: white; }
        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #E0E0E0; padding-top: 20px; }
      </style></head>
      <body>
        <div class="header">
          <div>
            <div class="logo">SpinTradeHub</div>
            <div style="color:#999;font-size:12px;">B2B Industrial Trading Platform</div>
            <div style="color:#999;font-size:12px;">support@spintradehub.com | +971541635009</div>
          </div>
          <div style="text-align:right;">
            <div class="doc-type">${doc.type.replace('_', ' ')}</div>
            <div style="font-size:14px;color:#666;">Doc No: <strong>${doc.docNumber}</strong></div>
            <div style="font-size:12px;color:#999;">Date: ${new Date(doc.date).toLocaleDateString()}</div>
            <div><span class="status">${doc.status}</span></div>
          </div>
        </div>
        <div class="parties">
          <div class="party"><h4>From</h4><strong>${doc.senderName}</strong></div>
          <div class="party"><h4>To</h4><strong>${doc.receiverName}</strong></div>
        </div>
        <table>
          <tr><th>#</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
          ${doc.items.map((item, i) => `<tr><td>${i + 1}</td><td>${item.description}</td><td>${item.quantity}</td><td>${doc.currency} ${item.unitPrice.toFixed(2)}</td><td>${doc.currency} ${item.total.toFixed(2)}</td></tr>`).join('')}
          <tr class="total-row"><td colspan="4" style="text-align:right;">TOTAL AMOUNT</td><td>${doc.currency} ${doc.totalAmount.toFixed(2)}</td></tr>
        </table>
        ${doc.notes ? `<div style="background:#F5F5F5;padding:12px;border-radius:8px;margin-top:20px;"><strong>Notes:</strong> ${doc.notes}</div>` : ''}
        <div class="footer">
          <p>SpinTradeHub - B2B Industrial Trading Platform | spintradehub.com</p>
          <p>Phone: +971541635009 | Email: support@spintradehub.com</p>
          <p>This is a computer-generated document.</p>
        </div>
      </body></html>
    `;
    const win = window.open('', '_blank');
    if (win) { win.document.write(printContent); win.document.close(); win.print(); }
  };

  const filtered = activeTab === 'all' ? documents : documents.filter(d => d.type === activeTab);

  if (authLoading || loading) {
    return <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ backgroundColor: '#F5F5F5', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0056D2 0%, #0041A8 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/profile" style={{ color: 'white', fontSize: '20px', textDecoration: 'none' }}>←</Link>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>📄 Documents</h1>
          </div>
          <button onClick={() => setShowCreateModal(true)} style={{ padding: '10px 20px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
            + New Document
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total', count: documents.length, icon: '📄', color: '#0056D2' },
            { label: 'Quotations', count: documents.filter(d => d.type === 'QUOTATION').length, icon: '📋', color: '#9C27B0' },
            { label: 'Invoices', count: documents.filter(d => d.type === 'INVOICE').length, icon: '🧾', color: '#FF8C00' },
            { label: 'Bills', count: documents.filter(d => d.type === 'PURCHASE_BILL').length, icon: '📑', color: '#4CAF50' },
            { label: 'Pending', count: documents.filter(d => d.status === 'PENDING').length, icon: '⏳', color: '#FFA500' },
            { label: 'Accepted', count: documents.filter(d => d.status === 'ACCEPTED').length, icon: '✅', color: '#4CAF50' },
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{stat.icon}</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: stat.color }}>{stat.count}</div>
              <div style={{ fontSize: '11px', color: '#999', fontWeight: '600' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
          {(['all', 'QUOTATION', 'INVOICE', 'PURCHASE_BILL'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', backgroundColor: activeTab === tab ? '#0056D2' : 'white', color: activeTab === tab ? 'white' : '#666', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
              {tab === 'all' ? '📄 All' : tab === 'QUOTATION' ? '📋 Quotations' : tab === 'INVOICE' ? '🧾 Invoices' : '📑 Purchase Bills'}
            </button>
          ))}
        </div>

        {/* Documents List */}
        {filtered.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '60px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <h3 style={{ color: '#333', fontSize: '18px', margin: '0 0 8px 0' }}>No documents yet</h3>
            <p style={{ color: '#999', margin: '0 0 20px 0' }}>Create your first Quotation, Invoice or Purchase Bill</p>
            <button onClick={() => setShowCreateModal(true)} style={{ padding: '12px 28px', backgroundColor: '#0056D2', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>
              + Create Document
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(doc => (
              <div key={doc.id} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: doc.type === 'QUOTATION' ? 'rgba(156,33,243,0.1)' : doc.type === 'INVOICE' ? 'rgba(255,140,0,0.1)' : 'rgba(76,175,80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                    {TYPE_ICONS[doc.type]}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#333' }}>{doc.docNumber}</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', backgroundColor: STATUS_COLORS[doc.status] + '20', color: STATUS_COLORS[doc.status] }}>{doc.status}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>To: <strong>{doc.receiverName}</strong> • {new Date(doc.date).toLocaleDateString()}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#FF8C00', marginTop: '2px' }}>{doc.currency} {doc.totalAmount.toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setViewingDoc(doc)} style={{ padding: '8px 14px', backgroundColor: '#0056D2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>View</button>
                  <button onClick={() => handlePrint(doc)} style={{ padding: '8px 14px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>🖨️ Print</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Document Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '640px', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#333' }}>📄 New Document</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: '#F5F5F5', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            {/* Document Type */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>Document Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {DOC_TYPES.map(type => (
                  <button key={type} onClick={() => setForm({ ...form, type })} style={{ padding: '10px', borderRadius: '10px', border: `2px solid ${form.type === type ? '#0056D2' : '#E0E0E0'}`, backgroundColor: form.type === type ? '#EFF4FF' : 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: form.type === type ? '#0056D2' : '#666' }}>
                    {TYPE_ICONS[type]}<br />{type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient & Currency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#666', marginBottom: '6px' }}>Recipient Name *</label>
                <input value={form.receiverName} onChange={e => setForm({ ...form, receiverName: e.target.value })} placeholder="Company or person name" style={{ width: '100%', padding: '10px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#666', marginBottom: '6px' }}>Currency</label>
                <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}>
                  <option>AED</option><option>USD</option><option>EUR</option><option>GBP</option><option>SAR</option><option>INR</option>
                </select>
              </div>
            </div>

            {/* Items */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase' }}>Line Items</label>
                <button onClick={addItem} style={{ padding: '4px 12px', backgroundColor: '#0056D2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>+ Add Row</button>
              </div>
              {form.items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 80px 30px', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
                  <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description" style={{ padding: '8px', border: '1px solid #E0E0E0', borderRadius: '6px', fontSize: '12px' }} />
                  <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} placeholder="Qty" style={{ padding: '8px', border: '1px solid #E0E0E0', borderRadius: '6px', fontSize: '12px', textAlign: 'center' }} />
                  <input type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} placeholder="Price" style={{ padding: '8px', border: '1px solid #E0E0E0', borderRadius: '6px', fontSize: '12px', textAlign: 'center' }} />
                  <div style={{ padding: '8px', backgroundColor: '#F5F5F5', borderRadius: '6px', fontSize: '12px', textAlign: 'center', fontWeight: '600' }}>{item.total.toFixed(0)}</div>
                  <button onClick={() => removeItem(i)} style={{ width: '28px', height: '28px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>×</button>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', backgroundColor: '#EFF4FF', padding: '10px 16px', borderRadius: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '15px', color: '#0056D2' }}>Total: {form.currency} {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#666', marginBottom: '6px' }}>Notes (Optional)</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Payment terms, delivery conditions, special instructions..." rows={3} style={{ width: '100%', padding: '10px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            <button onClick={handleCreate} disabled={submitting} style={{ width: '100%', padding: '14px', backgroundColor: submitting ? '#999' : '#0056D2', color: 'white', border: 'none', borderRadius: '12px', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: '700' }}>
              {submitting ? 'Creating...' : `✅ Create ${form.type.replace('_', ' ')}`}
            </button>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {viewingDoc && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '640px', marginTop: '20px', overflow: 'hidden' }}>
            {/* Doc Header */}
            <div style={{ background: 'linear-gradient(135deg, #0056D2 0%, #0041A8 100%)', padding: '24px', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>SpinTradeHub</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>B2B Industrial Trading Platform</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>+971541635009 | support@spintradehub.com</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FF8C00', marginBottom: '4px' }}>{TYPE_ICONS[viewingDoc.type]} {viewingDoc.type.replace('_', ' ')}</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>#{viewingDoc.docNumber}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>{new Date(viewingDoc.date).toLocaleDateString()}</div>
                  <div style={{ marginTop: '6px', padding: '3px 10px', borderRadius: '12px', backgroundColor: STATUS_COLORS[viewingDoc.status], fontSize: '11px', fontWeight: '700', display: 'inline-block' }}>{viewingDoc.status}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Parties */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#F5F5F5', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>FROM</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#333' }}>{viewingDoc.senderName}</div>
                </div>
                <div style={{ backgroundColor: '#F5F5F5', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>TO</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#333' }}>{viewingDoc.receiverName}</div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0056D2', color: 'white' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Unit Price</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingDoc.items.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F0F0F0' }}>
                        <td style={{ padding: '10px', color: '#999' }}>{i + 1}</td>
                        <td style={{ padding: '10px', fontWeight: '600' }}>{item.description}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{viewingDoc.currency} {item.unitPrice.toFixed(2)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>{viewingDoc.currency} {item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#EFF4FF' }}>
                      <td colSpan={4} style={{ padding: '12px', textAlign: 'right', fontWeight: '700', fontSize: '14px' }}>TOTAL AMOUNT</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', fontSize: '16px', color: '#FF8C00' }}>{viewingDoc.currency} {viewingDoc.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {viewingDoc.notes && (
                <div style={{ backgroundColor: '#FFF8E7', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', borderLeft: '4px solid #FF8C00' }}>
                  <strong>Notes:</strong> {viewingDoc.notes}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => handlePrint(viewingDoc)} style={{ flex: 1, padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>🖨️ Print / Download PDF</button>
                {viewingDoc.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleStatusUpdate(viewingDoc.id!, 'ACCEPTED')} style={{ flex: 1, padding: '12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>✅ Accept</button>
                    <button onClick={() => handleStatusUpdate(viewingDoc.id!, 'REJECTED')} style={{ flex: 1, padding: '12px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>❌ Reject</button>
                  </>
                )}
                <button onClick={() => setViewingDoc(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#E0E0E0', color: '#333', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 20 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span><span>Home</span>
        </Link>
        <Link href="/feed" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📦</span><span>Feed</span>
        </Link>
        <Link href="/orders" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🛒</span><span>Orders</span>
        </Link>
        <Link href="/documents" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#0056D2', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📄</span><span>Documents</span>
        </Link>
        <Link href="/profile" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', textDecoration: 'none', color: '#999', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>👤</span><span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
