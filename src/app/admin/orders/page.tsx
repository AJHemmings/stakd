"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';

type OrderStatus = 'RECEIVED' | 'PREPARING' | 'BAKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

interface RawAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

interface Order {
  id: string;
  customer: string;
  email: string;
  address: string;
  rawAddress: RawAddress | null;
  date: string;
  items: { name: string; quantity: number; base: string; price: number }[];
  total: number;
  paymentStatus: 'PAID' | 'PENDING';
  status: OrderStatus;
  notes?: string;
  batchId?: string | null;
}

function formatAddress(addr: RawAddress | null): string {
  if (!addr) return 'No address';
  return [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]
    .filter(Boolean)
    .join('\n');
}


const ALL_STATUSES: { value: OrderStatus; label: string; color: string; bg: string }[] = [
  { value: 'RECEIVED', label: 'Order Received', color: '#e65100', bg: '#fff3e0' },
  { value: 'PREPARING', label: 'Preparing Ingredients', color: '#f57c00', bg: '#ffe0b2' },
  { value: 'BAKED', label: 'Baked & Ready', color: '#006064', bg: '#e0f7fa' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: '#1565c0', bg: '#e3f2fd' },
  { value: 'DELIVERED', label: 'Delivered', color: '#2e7d32', bg: '#e8f5e9' },
];

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | 'ALL' | 'BATCHES'>('ALL');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [showPrintSummary, setShowPrintSummary] = useState(false);
  const [printView, setPrintView] = useState<'SELECT' | 'PREP' | 'LABELS'>('SELECT');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/orders');
    const data = await res.json();
    if (!res.ok) {
      console.error('Error fetching orders:', data.error);
    } else {
      const mappedOrders: Order[] = data.map((o: any) => ({
        id: o.id.substring(0, 8).toUpperCase(),
        realId: o.id,
        customer: o.customer_name,
        email: o.customer_email,
        address: formatAddress(o.shipping_address),
        rawAddress: o.shipping_address ?? null,
        date: new Date(o.created_at).toLocaleString('en-GB'),
        items: o.items.map((i: any) => ({
          name: i.product_name,
          quantity: i.quantity,
          base: i.base_name,
          price: i.unit_price
        })),
        total: o.total_amount,
        paymentStatus: o.payment_status === 'paid' ? 'PAID' : 'PENDING',
        status: o.fulfillment_status as OrderStatus,
        notes: o.notes,
        batchId: o.batch_id
      }));
      setOrders(mappedOrders);
    }
    setLoading(false);
  };

  const filteredOrders = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  const getStatusBadge = (status: OrderStatus) => {
    const s = ALL_STATUSES.find(opt => opt.value === status);
    if (!s) return null;
    return (
      <span style={{ 
        background: s.bg, color: s.color, 
        padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' 
      }}>
        {s.label}
      </span>
    );
  };

  const handleOpenModal = (order: Order) => {
    setSelectedOrder(order);
    setPendingStatus(order.status);
  };

  const handleStatusSave = async () => {
    if (!selectedOrder || !pendingStatus) return;
    const realOrder = orders.find(o => o.id === selectedOrder.id);
    if (!realOrder) return;

    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [(realOrder as any).realId], updates: { fulfillment_status: pendingStatus } }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      alert(`Error updating status: ${error}`);
    } else {
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: pendingStatus } : o));
      setSelectedOrder(null);
    }
  };

  // Aggregation Logic for Print Summary
  const newOrders = orders.filter(o => o.status === 'RECEIVED');
  const ordersToPrint = newOrders.filter(o => selectedOrderIds.includes(o.id));
  
  const prepList = ordersToPrint.reduce((acc, order) => {
    order.items.forEach(item => {
      const key = `${item.name} (${item.base})`;
      acc[key] = (acc[key] || 0) + item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);
  const totalRevenue = ordersToPrint.reduce((sum, o) => sum + o.total, 0);

  const handleConfirmPrint = async () => {
    const selectedRealIds = orders
      .filter(o => selectedOrderIds.includes(o.id))
      .map(o => (o as any).realId);

    const newBatchId = `batch-${Date.now()}`;

    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedRealIds, updates: { fulfillment_status: 'PREPARING', batch_id: newBatchId } }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      alert(`Error updating batch status: ${error}`);
    } else {
      setOrders(prev => prev.map(o => selectedOrderIds.includes(o.id) ? { ...o, status: 'PREPARING', batchId: newBatchId } : o));
      setShowPrintSummary(false);
      alert(`${selectedOrderIds.length} order(s) updated to PREPARING status and added to ${newBatchId}.`);
    }
  };

  const handleEscalateBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to escalate this batch to SHIPPED?')) return;

    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId, updates: { fulfillment_status: 'OUT_FOR_DELIVERY' } }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      alert(`Error escalating batch: ${error}`);
    } else {
      setOrders(prev => prev.map(o => o.batchId === batchId ? { ...o, status: 'OUT_FOR_DELIVERY' } : o));
      alert(`Batch ${batchId} escalated to SHIPPED (OUT_FOR_DELIVERY).`);
    }
  };

  const downloadCSV = (batchId: string, provider: 'ROYAL_MAIL' | 'HERMES' | 'YODEL') => {
    const batchOrders = orders.filter(o => o.batchId === batchId);
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (provider === 'ROYAL_MAIL') {
      csvContent += "Name,Address 1,Address 2,City,Postcode,Country,Email,Weight,Service\\n";
      batchOrders.forEach(o => {
        const a = o.rawAddress;
        csvContent += `"${o.customer}","${a?.line1 || ''}","${a?.line2 || ''}","${a?.city || ''}","${a?.postal_code || ''}","${a?.country || 'GB'}","${o.email}","500","Tracked 48"\\n`;
      });
    } else if (provider === 'HERMES') {
      csvContent += "Customer Name,Address Line 1,Address Line 2,Town,Postcode,Country,Email,Phone,Weight (kg)\\n";
      batchOrders.forEach(o => {
        const a = o.rawAddress;
        csvContent += `"${o.customer}","${a?.line1 || ''}","${a?.line2 || ''}","${a?.city || ''}","${a?.postal_code || ''}","${a?.country || 'GB'}","${o.email}","","0.5"\\n`;
      });
    } else if (provider === 'YODEL') {
      csvContent += "Name,Address1,Address2,Town,Postcode,Country,Email,Weight\\n";
      batchOrders.forEach(o => {
        const a = o.rawAddress;
        csvContent += `"${o.customer}","${a?.line1 || ''}","${a?.line2 || ''}","${a?.city || ''}","${a?.postal_code || ''}","${a?.country || 'GB'}","${o.email}","0.5"\\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stakd_orders_${provider}_${batchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>ORDERS</h1>
          <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)' }}>Manage incoming orders and fulfillments.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant={filter === 'ALL' ? 'primary' : 'outline'} onClick={() => setFilter('ALL')}>All</Button>
          <Button variant={filter === 'RECEIVED' ? 'primary' : 'outline'} onClick={() => setFilter('RECEIVED')}>Received</Button>
          <Button variant={filter === 'PREPARING' ? 'primary' : 'outline'} onClick={() => setFilter('PREPARING')}>Preparing</Button>
          <Button variant={filter === 'BAKED' ? 'primary' : 'outline'} onClick={() => setFilter('BAKED')}>Baked</Button>
          <Button variant={filter === 'OUT_FOR_DELIVERY' ? 'primary' : 'outline'} onClick={() => setFilter('OUT_FOR_DELIVERY')}>Out for Delivery</Button>
          <Button variant={filter === 'BATCHES' ? 'primary' : 'outline'} onClick={() => setFilter('BATCHES')} style={{ marginLeft: '1rem', background: filter === 'BATCHES' ? 'var(--dark)' : 'transparent', borderColor: 'var(--dark)' }}>Batches</Button>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'var(--cream)', borderBottom: '2px solid var(--cream-dark)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--grey)', fontWeight: 600 }}>
            {filter === 'BATCHES' ? 'ACTIVE BATCHES' : 'ORDER LIST'}
          </span>
          {filter !== 'BATCHES' && (
            <button 
              onClick={() => {
                setPrintView('SELECT');
                setSelectedOrderIds([]);
                setShowPrintSummary(true);
              }}
              style={{ 
                background: 'var(--dark)', color: 'var(--gold)', border: 'none', 
                padding: '0.5rem 1rem', borderRadius: '2px', fontFamily: 'var(--font-mono)', 
                fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                transition: 'transform 0.1s'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              CREATE NEW BATCH
            </button>
          )}
        </div>
        
        {filter === 'BATCHES' ? (
          <div style={{ padding: '2rem' }}>
            {Array.from(new Set(orders.filter(o => o.batchId).map(o => o.batchId))).map(batchId => {
              if (!batchId) return null;
              const batchOrders = orders.filter(o => o.batchId === batchId);
              const isShipped = batchOrders.every(o => o.status === 'OUT_FOR_DELIVERY' || o.status === 'DELIVERED');
              return (
                <div key={batchId} style={{ 
                  border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1.5rem', 
                  marginBottom: '1.5rem', background: 'var(--white)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{batchId}</h3>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)' }}>{batchOrders.length} orders</p>
                    </div>
                    <div>
                      {isShipped ? (
                        <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>SHIPPED</span>
                      ) : (
                        <Button variant="primary" onClick={() => handleEscalateBatch(batchId)}>Escalate to Shipped</Button>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ background: 'var(--cream)', padding: '1rem', borderRadius: '4px' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--dark)', fontWeight: 600, marginBottom: '0.5rem' }}>EXPORT SHIPPING LABELS (CSV)</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Button variant="outline" onClick={() => downloadCSV(batchId, 'ROYAL_MAIL')}>Royal Mail Click & Drop</Button>
                      <Button variant="outline" onClick={() => downloadCSV(batchId, 'HERMES')}>Evri (Hermes)</Button>
                      <Button variant="outline" onClick={() => downloadCSV(batchId, 'YODEL')}>Yodel</Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {orders.filter(o => o.batchId).length === 0 && (
              <p style={{ color: 'var(--grey)', textAlign: 'center' }}>No batches found.</p>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--white)', borderBottom: '2px solid var(--cream-dark)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)' }}>
                <th style={{ padding: '1.5rem' }}>ORDER</th>
                <th>DATE</th>
                <th>CUSTOMER</th>
                <th>PAYMENT</th>
                <th>FULFILLMENT STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id} 
                  onClick={() => handleOpenModal(order)}
                  style={{ 
                    borderBottom: '1px solid var(--cream-dark)', background: 'var(--white)', 
                    transition: 'background 0.2s', cursor: 'pointer' 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cream)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--white)'}
                >
                  <td style={{ padding: '1.5rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{order.id}</td>
                  <td style={{ color: 'var(--grey)', fontSize: '0.9rem' }}>{order.date}</td>
                  <td style={{ fontWeight: 600 }}>{order.customer}</td>
                  <td>
                    <span style={{ 
                      background: order.paymentStatus === 'PAID' ? '#e8f5e9' : '#fff3e0', 
                      color: order.paymentStatus === 'PAID' ? '#2e7d32' : '#ef6c00', 
                      padding: '0.2rem 0.6rem', borderRadius: '2px', fontSize: '0.8rem', fontWeight: 600 
                    }}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td>{getStatusBadge(order.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--grey)' }}>
            Loading orders...
          </div>
        ) : filter !== 'BATCHES' && filteredOrders.length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--grey)' }}>
            No orders found matching this filter.
          </div>
        )}
      </div>

      {/* Order Details Modal/Slide-over */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '500px',
          background: 'var(--white)', boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
          zIndex: 1000, display: 'flex', flexDirection: 'column',
          transform: 'translateX(0)', transition: 'transform 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{ padding: '2rem', borderBottom: '1px solid var(--cream-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '2rem' }}>Order {selectedOrder.id}</h2>
              <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--grey)', fontSize: '0.9rem' }}>{selectedOrder.date}</p>
            </div>
            <button 
              onClick={() => setSelectedOrder(null)}
              style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: 'var(--grey)' }}
            >&times;</button>
          </div>

          {/* Content */}
          <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
            
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--choc-mid)' }}>Customer Details</h3>
              <p style={{ fontWeight: 600 }}>{selectedOrder.customer}</p>
              <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{selectedOrder.email}</p>
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--cream)', borderRadius: '2px', borderLeft: '2px solid var(--gold)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)', marginBottom: '0.2rem' }}>SHIPPING ADDRESS</p>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedOrder.address}</p>
              </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--choc-mid)' }}>Order Items</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px dashed var(--cream-dark)' }}>
                    <div>
                      <p style={{ fontWeight: 600 }}>{item.quantity}x {item.name}</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)' }}>Base: {item.base}</p>
                    </div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>£{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '1.2rem' }}>
                <span style={{ fontFamily: 'var(--font-bebas)' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold)' }}>£{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ background: 'var(--cream)', padding: '1.5rem', borderRadius: '4px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--dark)' }}>Update Fulfillment</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--grey)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Changing this status will update the tracker on the customer's profile page.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                {/* Only show statuses that come AFTER Received */}
                {ALL_STATUSES.filter(s => s.value !== 'RECEIVED').map(status => (
                  <div 
                    key={status.value}
                    onClick={() => setPendingStatus(status.value)}
                    style={{ 
                      padding: '1rem', 
                      background: pendingStatus === status.value ? 'var(--white)' : 'transparent',
                      border: `2px solid ${pendingStatus === status.value ? 'var(--gold)' : 'var(--cream-dark)'}`,
                      borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem'
                    }}
                  >
                    <div style={{ 
                      width: '16px', height: '16px', borderRadius: '50%', 
                      background: pendingStatus === status.value ? 'var(--gold)' : 'transparent',
                      border: '2px solid var(--gold)'
                    }}></div>
                    <span style={{ fontWeight: pendingStatus === status.value ? 700 : 400 }}>
                      {status.label}
                    </span>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="primary" 
                style={{ width: '100%' }} 
                onClick={handleStatusSave}
                disabled={pendingStatus === selectedOrder.status}
              >
                Save Update
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal overlay background */}
      {selectedOrder && (
        <div 
          onClick={() => setSelectedOrder(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} 
        />
      )}

      {/* Daily Prep & Print Summary Overlay */}
      {showPrintSummary && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--white)', zIndex: 99999, overflowY: 'auto', padding: '3rem'
        }}>
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #print-section, #print-section * { visibility: visible; }
              #print-section { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
              .no-print { display: none !important; }
            }
          `}</style>
          
          <div id="print-section" style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'var(--font-outfit)' }}>
            
            <div className="no-print" style={{ marginBottom: '2rem' }}>
              <button 
                onClick={() => setShowPrintSummary(false)}
                style={{ background: 'none', border: 'none', fontSize: '1rem', color: 'var(--grey)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', padding: 0 }}
              >
                &larr; Back to Orders
              </button>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--cream-dark)' }}>
                <div>
                  <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>DAILY PREP SUMMARY</h2>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    <button 
                      onClick={() => setPrintView('SELECT')}
                      style={{ 
                        background: 'none', border: 'none', padding: '0.5rem 0', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                        color: printView === 'SELECT' ? 'var(--dark)' : 'var(--grey)',
                        borderBottom: printView === 'SELECT' ? '3px solid var(--gold)' : '3px solid transparent'
                      }}
                    >Select Orders</button>
                    <button 
                      onClick={() => setPrintView('PREP')}
                      style={{ 
                        background: 'none', border: 'none', padding: '0.5rem 0', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                        color: printView === 'PREP' ? 'var(--dark)' : 'var(--grey)',
                        borderBottom: printView === 'PREP' ? '3px solid var(--gold)' : '3px solid transparent',
                        opacity: selectedOrderIds.length === 0 ? 0.5 : 1
                      }}
                      disabled={selectedOrderIds.length === 0}
                    >Kitchen Prep List</button>
                    <button 
                      onClick={() => setPrintView('LABELS')}
                      style={{ 
                        background: 'none', border: 'none', padding: '0.5rem 0', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                        color: printView === 'LABELS' ? 'var(--dark)' : 'var(--grey)',
                        borderBottom: printView === 'LABELS' ? '3px solid var(--gold)' : '3px solid transparent',
                        opacity: selectedOrderIds.length === 0 ? 0.5 : 1
                      }}
                      disabled={selectedOrderIds.length === 0}
                    >Shipping Labels</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', paddingBottom: '0.5rem' }}>
                  {printView === 'SELECT' ? (
                    <Button 
                      variant="primary" 
                      style={{ background: 'var(--gold)', color: 'var(--dark)' }} 
                      disabled={selectedOrderIds.length === 0}
                      onClick={() => setPrintView('PREP')}
                    >
                      Generate Print Summary
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => window.print()}>Print (Ctrl+P)</Button>
                      <Button variant="primary" style={{ background: 'var(--gold)', color: 'var(--dark)' }} onClick={handleConfirmPrint}>Confirm & Update to Preparing</Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {newOrders.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--grey)' }}>
                No new orders in RECEIVED status.
              </div>
            ) : (
              <>
                {printView === 'SELECT' && (
                  <div style={{ padding: '2rem 0' }}>
                    <p style={{ marginBottom: '2rem', color: 'var(--grey)', fontSize: '1.1rem' }}>
                      Select the specific orders you want to prepare today. Unselected orders will remain in the RECEIVED queue.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                      {newOrders.map(order => {
                        const isSelected = selectedOrderIds.includes(order.id);
                        return (
                          <div 
                            key={order.id} 
                            onClick={() => setSelectedOrderIds(prev => isSelected ? prev.filter(id => id !== order.id) : [...prev, order.id])}
                            style={{ 
                              border: isSelected ? '2px solid var(--gold)' : '2px solid var(--cream-dark)', 
                              background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'var(--white)',
                              padding: '1.5rem', borderRadius: '8px', cursor: 'pointer',
                              display: 'flex', flexDirection: 'column', position: 'relative',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ 
                              position: 'absolute', top: '1.5rem', right: '1.5rem', 
                              width: '24px', height: '24px', borderRadius: '4px',
                              border: isSelected ? '2px solid var(--gold)' : '2px solid var(--grey)',
                              background: isSelected ? 'var(--gold)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)', marginBottom: '0.5rem' }}>ORDER {order.id}</span>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{order.customer}</h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--dark)' }}>
                              {order.items.map((item, i) => (
                                <li key={i} style={{ marginBottom: '0.3rem' }}>{item.quantity}x {item.name}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {printView === 'PREP' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                      <h1 style={{ fontSize: '3rem', margin: 0 }}>KITCHEN PREP LIST</h1>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--grey)' }}>DATE: {new Date().toLocaleDateString()}</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.2rem' }}>TOTAL VOL: £{totalRevenue.toFixed(2)}</p>
                      </div>
                    </div>

                    <div style={{ background: 'var(--cream)', padding: '2rem', borderRadius: '4px', border: '2px solid var(--dark)', marginBottom: '4rem' }}>
                      <h2 style={{ borderBottom: '2px solid var(--cream-dark)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Total Items to Bake</h2>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {Object.entries(prepList).map(([item, count]) => (
                          <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.2rem' }}>
                            <span style={{ 
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
                              background: 'var(--dark)', color: 'var(--gold)', fontWeight: 700, 
                              width: '40px', height: '40px', borderRadius: '4px', fontFamily: 'var(--font-mono)'
                            }}>{count}x</span>
                            <span style={{ fontWeight: 600 }}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {printView === 'LABELS' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                      <h1 style={{ fontSize: '3rem', margin: 0 }}>SHIPPING LABELS</h1>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--grey)' }}>DATE: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
                      {ordersToPrint.map(order => (
                        <div key={order.id} style={{ 
                          border: '2px dashed var(--grey)', padding: '2rem', borderRadius: '8px', 
                          pageBreakInside: 'avoid', minHeight: '150px',
                          display: 'flex', flexDirection: 'column', justifyContent: 'center'
                        }}>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)', marginBottom: '0.5rem' }}>ORDER {order.id}</p>
                          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{order.customer}</h3>
                          <p style={{ fontSize: '1.2rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{order.address}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

