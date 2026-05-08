"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type EmailType = 'welcome' | 'order' | 'shipping';

export default function EmailPreviewPage() {
  const [activeTab, setActiveTab] = useState<EmailType>('welcome');
  const [email, setEmail] = useState('');
  const [testUser, setTestUser] = useState('Legendary Customer');
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    fetchPreview();
  }, [activeTab, testUser]);

  const fetchPreview = async () => {
    const res = await fetch(`/api/test-email/preview?type=${activeTab}&name=${testUser}`);
    const data = await res.json();
    setPreviewHtml(data.html);
  };

  const handleSendTest = async () => {
    if (!email) {
      setStatus({ type: 'error', msg: 'Please enter an email address first.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/test-email?email=${email}&type=${activeTab}&name=${testUser}`);
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: `Test ${activeTab} email sent to ${email}!` });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: `Failed: ${err.message}` });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-outfit)' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontFamily: 'var(--font-bebas)' }}>Email Design Studio</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        {/* Sidebar Controls */}
        <div style={{ background: 'var(--cream)', padding: '2rem', borderRadius: '8px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Configure Test</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>TEMPLATE</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(['welcome', 'order', 'shipping'] as EmailType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    style={{
                      padding: '0.8rem',
                      textAlign: 'left',
                      background: activeTab === t ? 'var(--dark)' : 'var(--white)',
                      color: activeTab === t ? 'var(--white)' : 'var(--dark)',
                      border: '1px solid var(--cream-dark)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}
                  >
                    {t} Email
                  </button>
                ))}
              </div>
            </div>

            <Input 
              label="Recipient Name" 
              value={testUser} 
              onChange={(e) => setTestUser(e.target.value)} 
            />

            <div style={{ borderTop: '1px solid var(--cream-dark)', paddingTop: '1.5rem' }}>
              <Input 
                label="Send Test To" 
                placeholder="your@email.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
              <Button 
                variant="primary" 
                onClick={handleSendTest} 
                disabled={loading}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {loading ? 'Sending...' : 'Send Live Test'}
              </Button>
              
              {status && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  background: status.type === 'success' ? '#e8f5e9' : '#ffebee',
                  color: status.type === 'success' ? '#2e7d32' : '#c62828'
                }}>
                  {status.msg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', background: 'var(--cream)', borderBottom: '1px solid var(--cream-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--grey)' }}>DESKTOP PREVIEW</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></div>
            </div>
          </div>
          <iframe 
            srcDoc={previewHtml} 
            style={{ width: '100%', height: '800px', border: 'none' }}
            title="Email Preview"
          />
        </div>
      </div>
    </div>
  );
}
