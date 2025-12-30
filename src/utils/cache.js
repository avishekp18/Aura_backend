// Simple in-memory cache with TTL. Suitable for small datasets per user.
const store = new Map();

export function setCache(key, value, ttlMs = 60_000) {
  const expiresAt = Date.now() + ttlMs;
  store.set(key, { value, expiresAt });
}

export function getCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function deleteCache(key) {
  store.delete(key);
}

export function deleteByPrefix(prefix) {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
