"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { OrderList, Order } from './OrderList';

const TICKET_STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Open', color: '#e65100', bg: '#fff3e0' },
  IN_PROGRESS: { label: 'In Progress', color: '#1565c0', bg: '#e3f2fd' },
  RESOLVED: { label: 'Resolved', color: '#2e7d32', bg: '#e8f5e9' },
};

interface Ticket {
  id: string;
  created_at: string;
  order_reference: string | null;
  message: string;
  status: string;
  unread_by_customer: boolean;
}

interface Message {
  id: string;
  created_at: string;
  author: string;
  message: string;
}

function TicketThread({ ticket, onClose, onRead }: { ticket: Ticket; onClose: () => void; onRead: (id: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/support/${ticket.id}`)
      .then(r => r.json())
      .then(d => {
        setMessages(d.messages ?? []);
        onRead(ticket.id);
      });
  }, [ticket.id]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    const res = await fetch(`/api/support/${ticket.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: reply }),
    });
    setSending(false);
    if (res.ok) {
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setReply('');
    }
  };

  const s = TICKET_STATUS_STYLES[ticket.status] || { label: ticket.status, color: '#333', bg: '#eee' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '480px',
        background: 'var(--white)', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--cream-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--grey)', marginBottom: '0.4rem' }}>
              {ticket.order_reference ? `Order #${ticket.order_reference}` : 'Support Ticket'}
            </p>
            <span style={{ background: s.bg, color: s.color, padding: '0.2rem 0.6rem', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
              {s.label}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--grey)', lineHeight: 1 }}>&times;</button>
        </div>

        {/* Thread */}
        <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.length === 0 && (
            <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>Loading...</p>
          )}
          {messages.map(msg => {
            const isAdmin = msg.author === 'admin';
            const time = new Date(msg.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-start' : 'flex-end' }}>
                <div style={{
                  maxWidth: '85%', padding: '0.75rem 1rem',
                  background: isAdmin ? 'var(--cream)' : 'var(--dark)',
                  color: isAdmin ? 'var(--dark)' : 'var(--cream)',
                  borderRadius: isAdmin ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                  fontSize: '0.9rem', lineHeight: 1.5,
                }}>
                  {msg.message}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--grey)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                  {isAdmin ? 'STAK\'D Support' : 'You'} · {time}
                </span>
              </div>
            );
          })}
        </div>

        {/* Reply */}
        {ticket.status !== 'RESOLVED' && (
          <form onSubmit={handleReply} style={{ borderTop: '1px solid var(--cream-dark)', padding: '1rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexShrink: 0 }}>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(e as any); } }}
              placeholder="Add a message... (Enter to send)"
              rows={2}
              style={{
                flex: 1, padding: '0.75rem', border: '1px solid var(--cream-dark)', borderRadius: '4px',
                fontFamily: 'var(--font-mono)', fontSize: '0.85rem', resize: 'none', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              style={{
                padding: '0.75rem 1.1rem', background: 'var(--dark)', color: 'var(--gold)',
                border: 'none', borderRadius: '4px', fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                opacity: sending || !reply.trim() ? 0.5 : 1, flexShrink: 0,
              }}
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
        )}
        {ticket.status === 'RESOLVED' && (
          <div style={{ borderTop: '1px solid var(--cream-dark)', padding: '1rem 1.5rem', textAlign: 'center', background: '#e8f5e9' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#2e7d32' }}>This ticket is resolved.</p>
          </div>
        )}
      </div>
    </>
  );
}

export function ProfileContent({ user, initialOrders }: { user: { email: string }; initialOrders: Order[] }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [openTicket, setOpenTicket] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(async () => {
    const res = await fetch('/api/support');
    if (res.ok) setTickets(await res.json());
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return (
    <>
      {openTicket && (
        <TicketThread
          ticket={openTicket}
          onClose={() => setOpenTicket(null)}
          onRead={(id) => setTickets(prev => prev.map(t => t.id === id ? { ...t, unread_by_customer: false } : t))}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '4rem', alignItems: 'start' }}>
        {/* Left: Account + Support */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--choc-mid)' }}>Details</h2>
            <div className="card" style={{ padding: '1.5rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--grey)', marginBottom: '0.4rem' }}>EMAIL</p>
              <p style={{ fontSize: '1rem', fontWeight: 600, wordBreak: 'break-all' }}>{user.email}</p>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--choc-mid)' }}>Support</h2>
            {tickets.length === 0 ? (
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--grey)', fontSize: '0.9rem' }}>No active tickets.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {tickets.map(ticket => {
                  const s = TICKET_STATUS_STYLES[ticket.status] || { label: ticket.status, color: '#333', bg: '#eee' };
                  const date = new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setOpenTicket(ticket)}
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      <div className="card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--grey)' }}>
                            {ticket.order_reference ? `#${ticket.order_reference}` : 'Support'} · {date}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem' }}>
                            {ticket.unread_by_customer && (
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e65100', display: 'inline-block', flexShrink: 0 }} title="New reply" />
                            )}
                            <span style={{ background: s.bg, color: s.color, padding: '0.15rem 0.5rem', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                              {s.label}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--dark)', lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticket.message}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Orders */}
        <OrderList orders={initialOrders} onTicketCreated={fetchTickets} />
      </div>
    </>
  );
}
