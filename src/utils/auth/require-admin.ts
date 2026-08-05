import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient } from '../supabase/server'

/**
 * Admin access is gated on an env allowlist rather than a database column.
 *
 * `user_metadata.role` is writable by the user themselves via auth.updateUser(),
 * so it cannot be trusted. `profiles.role` would be the conventional home but the
 * table is empty in production, so gating on it locks out every admin. An env
 * allowlist has no DB dependency and cannot be self-assigned.
 *
 * Long term this should move to `app_metadata`, which only the service role key
 * can write.
 */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Whether an email is on the admin allowlist. Use this when you already hold a
 * user object and only need the boolean — it avoids a second getUser() call.
 * This is not an access check on its own: anything that guards data must go
 * through requireAdmin() or getAdminUser(), which verify the session too.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allowlist = adminEmails()
  if (allowlist.length === 0) return false
  return allowlist.includes(email.toLowerCase())
}

/**
 * Returns the signed-in user if they are on the admin allowlist, otherwise null.
 * Use this where you need the user object or want to branch yourself — API
 * routes should prefer requireAdmin().
 */
export async function getAdminUser(): Promise<User | null> {
  const allowlist = adminEmails()

  // Fail closed: an unset or empty ADMIN_EMAILS grants nobody access rather
  // than everybody.
  if (allowlist.length === 0) {
    console.error('ADMIN_EMAILS is not set — denying all admin access')
    return null
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) return null
  if (!allowlist.includes(user.email.toLowerCase())) return null

  return user
}

/**
 * Guard for admin API routes. Call at the top of every handler:
 *
 *   const denied = await requireAdmin()
 *   if (denied) return denied
 *
 * Returns a 401 response when access is refused, or null when the caller is an
 * admin and the handler should proceed.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const user = await getAdminUser()
  if (user) return null

  // One status and one message for every failure mode — a signed-in non-admin
  // learns nothing about who is on the allowlist.
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
