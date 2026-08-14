import { Cache } from "@raycast/api";

import { SLDS_CACHE_CAPACITY, SLDS_CACHE_NAMESPACE, SLDS_CACHE_TTL_MS, SLDS_VERSION } from "./constants";

type CacheEnvelope<T> = {
  version: string;
  fetchedAt: number;
  data: T;
};

const cache = new Cache({ namespace: SLDS_CACHE_NAMESPACE, capacity: SLDS_CACHE_CAPACITY });

const readEnvelope = <T>(key: string): CacheEnvelope<T> | undefined => {
  const raw = cache.get(key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    cache.remove(key);
    return undefined;
  }
};

const isFresh = (envelope: CacheEnvelope<unknown>, ttlMs: number) =>
  envelope.version === SLDS_VERSION && Date.now() - envelope.fetchedAt < ttlMs;

/** Disk-backed TTL cache for SLDS CDN payloads. */
export const getOrFetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  { ttlMs = SLDS_CACHE_TTL_MS, force = false }: { ttlMs?: number; force?: boolean } = {},
): Promise<T> => {
  if (!force) {
    const cached = readEnvelope<T>(key);
    if (cached && isFresh(cached, ttlMs)) return cached.data;
  }

  const data = await fetcher();
  cache.set(key, JSON.stringify({ version: SLDS_VERSION, fetchedAt: Date.now(), data } satisfies CacheEnvelope<T>));
  return data;
};

export const invalidateSldsCache = () => cache.clear();

const previewKey = (apiName: string) => `icon-preview:${SLDS_VERSION}:gs:${apiName}`;

export const getCachedPreview = (apiName: string) => cache.get(previewKey(apiName));

export const setCachedPreview = (apiName: string, dataUri: string) => {
  cache.set(previewKey(apiName), dataUri);
};
