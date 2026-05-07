"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  q: string;
  a: React.ReactNode;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const SECTIONS: FAQSection[] = [
  {
    title: 'Delivery',
    items: [
      {
        q: 'How much does delivery cost?',
        a: (
          <>
            Shipping is calculated by how many bars you order:
            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <li>1 bar — £3.99</li>
              <li>2–3 bars — £5.49</li>
              <li>4+ bars — £7.49</li>
              <li style={{ fontWeight: 600 }}>Orders over £45 — Free delivery</li>
            </ul>
          </>
        ),
      },
      {
        q: 'How long does delivery take?',
        a: 'We ship via Royal Mail Tracked. You can expect your order to arrive within 3–5 working days of placing it. You\'ll receive an email confirmation once your order is on its way.',
      },
      {
        q: 'Do you ship outside the UK?',
        a: 'We currently ship to UK addresses only. We\'re working on expanding — keep an eye on our updates.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes. Once your order has been dispatched you\'ll receive a confirmation email. Royal Mail Tracked shipments include a tracking reference so you can follow your parcel.',
      },
      {
        q: 'Will my order fit through the letterbox?',
        a: 'Probably not. Our bars are thick by design — that\'s the point. Most orders will be delivered as a small parcel, so make sure someone is in or that you have a safe place for the delivery driver to leave it.',
      },
    ],
  },
  {
    title: 'The Bars',
    items: [
      {
        q: 'How big are the bars?',
        a: 'Each bar weighs between 470–500g. They\'re generously sized — designed to be shared, or not. We won\'t judge.',
      },
      {
        q: 'What bases are available?',
        a: 'Each product comes in a range of bases — for example, cookie dough, brownie, or blondie. The base is the layer that the chocolate is built on top of. You\'ll find the available options on each product page.',
      },
      {
        q: 'Do the bars contain allergens?',
        a: 'Yes. Our products are made in a kitchen that handles milk, eggs, wheat, soya, and nuts. Full allergen information is listed on each individual product page — always check before ordering if you have any allergies or intolerances.',
      },
      {
        q: 'Are the bars suitable for vegetarians?',
        a: 'Most of our bars are suitable for vegetarians. Check the individual product page for full ingredient and dietary information.',
      },
      {
        q: 'How should I store my bar?',
        a: 'Keep your bar in a cool, dry place away from direct sunlight. If your home is warm, the fridge works well — just let it come to room temperature for 10–15 minutes before eating for the best texture. Once opened, consume within a few days.',
      },
      {
        q: 'What is the shelf life?',
        a: 'The best-before date is printed on each bar\'s packaging. We always send fresh stock, so you\'ll typically have several weeks from the date of delivery.',
      },
    ],
  },
  {
    title: 'Orders & Returns',
    items: [
      {
        q: 'My order arrived damaged — what do I do?',
        a: (
          <>
            We\'re sorry to hear that. Take a photo of the damage and get in touch via the{' '}
            <Link href="/contact" style={{ color: 'var(--gold)', borderBottom: '1px solid var(--gold)', textDecoration: 'none' }}>
              contact page
            </Link>
            . We\'ll make it right.
          </>
        ),
      },
      {
        q: 'Can I cancel or change my order?',
        a: 'We process orders quickly, so changes may not always be possible once payment is confirmed. Contact us as soon as possible and we\'ll do our best to help.',
      },
      {
        q: 'Can I return a product?',
        a: 'Due to the perishable nature of food products, we\'re unable to accept returns. If something is wrong with your order — damaged, missing, or incorrect — please contact us and we\'ll sort it.',
      },
      {
        q: 'Do I need an account to order?',
        a: 'Yes, an account is required to complete a purchase. It only takes a moment to sign up and it also gives you access to our loyalty rewards programme.',
      },
    ],
  },
  {
    title: 'Rewards & Vouchers',
    items: [
      {
        q: 'How does the loyalty programme work?',
        a: 'Every order you complete fills one circle on your loyalty card — you can see it in your account profile. Every 5 orders you hit a milestone and unlock a reward. Milestones go up to 50 orders, with 10 rewards in total. Rewards include free delivery, percentage discounts, and free bars.',
      },
      {
        q: 'How do I use a voucher code?',
        a: 'At checkout, open the "Voucher Code" tab in the discount section and enter your code. Valid codes are applied instantly. Only one discount can be applied per order.',
      },
      {
        q: 'Can I use a voucher and a reward at the same time?',
        a: 'No — only one discount applies per order. You\'ll need to choose between your voucher code or a loyalty reward.',
      },
      {
        q: 'Do my rewards expire?',
        a: 'Earned rewards stay in your account until you use them. There\'s no expiry date on loyalty milestones.',
      },
    ],
  },
];

function AccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid var(--cream-dark)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          padding: '1.1rem 0', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '1rem',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--dark)', lineHeight: 1.4 }}>
          {item.q}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--gold)',
          flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none',
          transition: 'transform 0.2s ease', display: 'inline-block',
        }}>
          +
        </span>
      </button>
      {open && (
        <div style={{
          paddingBottom: '1.1rem', fontSize: '0.9rem', color: 'var(--grey)',
          lineHeight: 1.8, fontFamily: 'var(--font-outfit)',
        }}>
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="container" style={{ padding: '5rem 2rem', paddingBottom: '8rem', maxWidth: '760px' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.75rem' }}>
        Help
      </p>
      <h1 style={{ fontSize: '3rem', marginBottom: '0.75rem', lineHeight: 1.1 }}>
        Frequently Asked Questions
      </h1>
      <p style={{ color: 'var(--grey)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '4rem' }}>
        Everything you need to know before your first order — or your fiftieth.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {SECTIONS.map(section => (
          <div key={section.title}>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--choc-mid)', marginBottom: '0.5rem',
            }}>
              {section.title}
            </p>
            <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '0 1.5rem' }}>
              {section.items.map(item => (
                <AccordionItem key={item.q} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '4rem', padding: '2rem', background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', textAlign: 'center' }}>
        <p style={{ fontWeight: 600, marginBottom: '0.4rem' }}>Still have a question?</p>
        <p style={{ color: 'var(--grey)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          We're a small team and we actually read every message.
        </p>
        <Link href="/contact" className="btn btn-primary" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', fontSize: '0.85rem', textDecoration: 'none' }}>
          Get in Touch
        </Link>
      </div>
    </div>
  );
}
