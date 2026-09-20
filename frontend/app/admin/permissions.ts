// Centralized RBAC helpers for the frontend. The server is the real
// authority (every API route re-checks permissions independently) — this
// module only decides what the UI shows, so it can safely read the
// permission snapshot issued at login without a network round trip.

export type StoredUser = {
  id: number
  email: string
  name: string | null
  role: string
  permissions: string[]
}

const STORAGE_KEY = 'pruview_user'

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user: StoredUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  // Non-sensitive hint for edge middleware to gate routes without a DB
  // call; the backend still enforces every permission independently.
  document.cookie = `pruview_role=${user.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY)
  document.cookie = 'pruview_role=; path=/; max-age=0'
}

export function hasPermission(permission: string): boolean {
  return !!getStoredUser()?.permissions.includes(permission)
}
