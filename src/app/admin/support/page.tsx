"use client";

import React, { useEffect, useState, useRef } from 'react';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

interface Ticket {
  id: string;
  created_at: string;
  order_reference: string | null;
  customer_email: string;
  message: string;
  status: TicketStatus;
  admin_notes: string | null;
  unread_by_admin: boolean;
}

interface Message {
  id: string;
  created_at: string;
  author: string;
  message: string;
}

const STATUS_OPTIONS: { value: TicketStatus; label: string; color: string; bg: string }[] = [
  { value: 'OPEN', label: 'Open', color: '#e65100', bg: '#fff3e0' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#1565c0', bg: '#e3f2fd' },
  { value: 'RESOLVED', label: 'Resolved', color: '#2e7d32', bg: '#e8f5e9' },
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_OPTIONS.find(o => o.value === status) ?? { label: status, color: '#333', bg: '#eee' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '0.25rem 0.7rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
      {s.label}
    </span>
  );
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<TicketStatus>('OPEN');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [filter, setFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchTickets = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/support');
    if (res.ok) setTickets(await res.json());
    setLoading(false);
  };

  const openTicket = async (ticket: Ticket) => {
    setSelected(ticket);
    setPendingStatus(ticket.status);
    setAdminNotes(ticket.admin_notes ?? '');
    setReply('');
    setSendError(null);
    const res = await fetch(`/api/admin/support/${ticket.id}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, unread_by_admin: false } : t));
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selected) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/admin/support/${selected.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setReply('');
        if (selected.status === 'OPEN') {
          const updated = { ...selected, status: 'IN_PROGRESS' as TicketStatus };
          setSelected(updated);
          setPendingStatus('IN_PROGRESS');
          setTickets(prev => prev.map(t => t.id === selected.id ? updated : t));
        }
      } else {
        const body = await res.json().catch(() => ({}));
        setSendError(body.error ?? `Server error ${res.status}`);
      }
    } catch (err) {
      setSendError('Network error — check your connection');
    } finally {
      setSending(false);
    }
  };

  const handleSaveMeta = async () => {
    if (!selected) return;
    setSavingMeta(true);
    const res = await fetch('/api/admin/support', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, status: pendingStatus, admin_notes: adminNotes }),
    });
    setSavingMeta(false);
    if (res.ok) {
      const updated = { ...selected, status: pendingStatus, admin_notes: adminNotes };
      setSelected(updated);
      setTickets(prev => prev.map(t => t.id === selected.id ? updated : t));
    }
  };

  const filtered = filter === 'ALL' ? tickets : tickets.filter(t => t.status === filter);
  const openCount = tickets.filter(t => t.status === 'OPEN').length;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>SUPPORT</h1>
          <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)' }}>
            {openCount} open ticket{openCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '0.4rem 0.9rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
              fontWeight: filter === f ? 700 : 400,
              background: filter === f ? 'var(--dark)' : 'transparent',
              color: filter === f ? 'var(--gold)' : 'var(--grey)',
              border: '1px solid', borderColor: filter === f ? 'var(--dark)' : 'var(--cream-dark)',
              borderRadius: '2px', cursor: 'pointer',
            }}>
              {f === 'ALL' ? 'All' : f === 'IN_PROGRESS' ? 'In Progress' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-wrap">
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--white)', borderBottom: '2px solid var(--cream-dark)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)' }}>
              <th style={{ padding: '1.5rem' }}>MESSAGE</th>
              <th>CUSTOMER</th>
              <th>ORDER</th>
              <th>DATE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ticket => (
              <tr key={ticket.id} onClick={() => openTicket(ticket)}
                style={{ borderBottom: '1px solid var(--cream-dark)', background: 'var(--white)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--white)'}
              >
                <td style={{ padding: '1.2rem 1.5rem', maxWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {ticket.unread_by_admin && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e65100', flexShrink: 0, display: 'inline-block' }} />
                    )}
                    <p style={{ margin: 0, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.message}</p>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--grey)' }}>{ticket.customer_email}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{ticket.order_reference ? `#${ticket.order_reference}` : '—'}</td>
                <td style={{ color: 'var(--grey)', fontSize: '0.9rem' }}>{new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td><StatusBadge status={ticket.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {loading && <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--grey)' }}>Loading...</div>}
        {!loading && filtered.length === 0 && <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--grey)' }}>No tickets found.</div>}
      </div>

      {/* Detail panel */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '520px',
            background: 'var(--white)', boxShadow: '-10px 0 40px rgba(0,0,0,0.12)',
            zIndex: 1000, display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--cream-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--grey)', marginBottom: '0.2rem' }}>
                  {selected.order_reference ? `Order #${selected.order_reference} · ` : ''}{selected.customer_email}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <StatusBadge status={selected.status} />
                  <select
                    value={pendingStatus}
                    onChange={e => setPendingStatus(e.target.value as TicketStatus)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', border: '1px solid var(--cream-dark)', borderRadius: '2px', padding: '0.2rem 0.4rem', background: 'var(--white)', cursor: 'pointer' }}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  {pendingStatus !== selected.status && (
                    <button onClick={handleSaveMeta} disabled={savingMeta} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'var(--dark)', color: 'var(--gold)', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>
                      {savingMeta ? '...' : 'Save'}
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--grey)', lineHeight: 1 }}>&times;</button>
            </div>

            {/* Message thread */}
            <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map(msg => {
                const isAdmin = msg.author === 'admin';
                const time = new Date(msg.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '85%', padding: '0.75rem 1rem',
                      background: isAdmin ? 'var(--dark)' : 'var(--cream)',
                      color: isAdmin ? 'var(--cream)' : 'var(--dark)',
                      borderRadius: isAdmin ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      fontSize: '0.9rem', lineHeight: 1.5,
                    }}>
                      {msg.message}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--grey)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                      {isAdmin ? 'You' : 'Customer'} · {time}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Admin notes (collapsible strip) */}
            <div style={{ borderTop: '1px solid var(--cream-dark)', padding: '0.75rem 2rem', background: 'var(--cream)', flexShrink: 0 }}>
              <input
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                onBlur={handleSaveMeta}
                placeholder="Internal notes (not visible to customer)..."
                style={{ width: '100%', border: 'none', background: 'transparent', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Reply input */}
            {sendError && (
              <div style={{ background: '#ffeaea', borderTop: '1px solid #ffcccc', padding: '0.5rem 2rem', flexShrink: 0 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#c0392b', margin: 0 }}>Send failed: {sendError}</p>
              </div>
            )}
            <form onSubmit={handleSendReply} style={{ borderTop: '1px solid var(--cream-dark)', padding: '1rem 2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexShrink: 0 }}>
              <textarea
                value={reply}
                onChange={e => { setReply(e.target.value); if (sendError) setSendError(null); }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(e as any); } }}
                placeholder="Reply to customer... (Enter to send)"
                rows={2}
                style={{
                  flex: 1, padding: '0.75rem', border: '1px solid var(--cream-dark)', borderRadius: '4px',
                  fontFamily: 'var(--font-mono)', fontSize: '0.9rem', resize: 'none', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                style={{
                  padding: '0.75rem 1.25rem', background: 'var(--dark)', color: 'var(--gold)',
                  border: 'none', borderRadius: '4px', fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                  opacity: sending || !reply.trim() ? 0.5 : 1, flexShrink: 0,
                }}
              >
                {sending ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
