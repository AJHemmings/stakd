import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendWelcomeEmail } from '@/utils/email';

// This route sends real mail from the verified domain. Unguarded it is an open
// relay: anyone could POST an arbitrary address and make hello@stakdbars.com
// mail a stranger. The admin guard used on /api/test-email is the wrong tool
// here because this runs during signup, before any session exists.
//
// Instead, the address in the body is not trusted as a destination — it is
// treated as a claim that is checked against auth.users. Mail only goes to an
// account that actually exists and was created moments ago, which is the only
// situation where a welcome email is legitimate.

// How recently the account must have been created. Generous enough to absorb a
// slow signup round-trip, short enough that an old address cannot be replayed.
const SIGNUP_WINDOW_MS = 10 * 60 * 1000;

// Defence in depth only. Vercel may run several instances, each with its own
// Map, so this raises the cost of hammering the endpoint rather than capping it
// globally. The account check above is what actually closes the hole.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const recentHits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (recentHits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  recentHits.set(key, hits);

  // Keep the map from growing without bound on a long-lived instance.
  if (recentHits.size > 5000) {
    for (const [k, times] of recentHits) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) recentHits.delete(k);
    }
  }

  return hits.length > RATE_LIMIT_MAX;
}

// The installed @supabase/supabase-js (2.104.0) has no getUserByEmail — the
// admin API offers only getUserById and a paginated listUsers. So the lookup
// pages through users. Fine at this scale; see the note at the bottom of this
// file for the version that does not need scanning at all.
const PER_PAGE = 1000;
const MAX_PAGES = 10;

async function findUserByEmail(email: string) {
  const supabase = createAdminClient();
  const target = email.toLowerCase();

  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw error;

    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < PER_PAGE) return null;
  }
  return null;
}

export async function POST(req: Request) {
  // Every path below returns this same response. Returning 404 for "no such
  // account" and 200 for "mail sent" would turn the endpoint into an email
  // enumeration oracle — a stranger could learn who has an account here by
  // watching the status code. Closing a relay by opening an oracle is not a fix.
  const ok = () => NextResponse.json({ success: true });

  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim() : '';

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const user = await findUserByEmail(email);
    if (!user) return ok();

    // An account that was not just created has no business receiving a welcome
    // email. This is what stops the endpoint being replayed against every
    // address that has ever signed up.
    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
    if (!createdAt || Date.now() - createdAt > SIGNUP_WINDOW_MS) return ok();

    // Derived from the verified address rather than taken from the body, so the
    // request cannot choose what text appears in mail sent to someone else.
    const name = (user.email ?? email).split('@')[0];

    await sendWelcomeEmail(user.email ?? email, name);
    return ok();
  } catch (error: any) {
    // Logged server-side but never reflected to the caller — the error text can
    // reveal whether the address exists, which is the oracle described above.
    console.error('Error in welcome API:', error);
    return ok();
  }
}

// Follow-up worth doing: Supabase can send this itself via a Send Email Hook or
// a database webhook on auth.users INSERT. That removes the endpoint entirely,
// so there is nothing left to abuse and no user scan. It needs dashboard
// configuration, which is why it is not done here.
