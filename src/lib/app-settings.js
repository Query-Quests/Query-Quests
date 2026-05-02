/**
 * Runtime-configurable application settings, persisted in the AppSetting
 * key/value table. Falls back to environment variables when a key is not
 * set in the database, so existing `.env` deployments keep working.
 *
 * Cached in memory with a short TTL to avoid hammering the DB on every
 * chat request; cache is invalidated on writes.
 */

import { prisma } from './prisma';

const CACHE_TTL_MS = 30_000;
const cache = new Map(); // key -> { value, expiresAt }

export async function getAppSetting(key, { envFallback } = {}) {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value ?? (envFallback ? process.env[envFallback] || '' : '');
  }
  let value = '';
  try {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    value = row?.value || '';
  } catch {
    value = '';
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  if (!value && envFallback) return process.env[envFallback] || '';
  return value;
}

export async function setAppSetting(key, value) {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  cache.delete(key);
}

export function maskApiKey(key) {
  if (!key) return '';
  if (key.length <= 8) return '••••';
  return `${key.slice(0, 7)}••••${key.slice(-4)}`;
}
