type AdminCacheEntry<T> = {
  expiresAt: number;
  promise?: Promise<T>;
  value?: T;
  hasValue: boolean;
};

type AdminCacheStore = Map<string, AdminCacheEntry<unknown>>;

declare global {
  // eslint-disable-next-line no-var
  var adminDataCache: AdminCacheStore | undefined;
}

const store = globalThis.adminDataCache ?? new Map<string, AdminCacheEntry<unknown>>();

if (process.env.NODE_ENV !== 'production') {
  globalThis.adminDataCache = store;
}

export const cachedAdminData = async <T>(
  key: string,
  load: () => Promise<T>,
  ttlMs = 30_000,
): Promise<T> => {
  const now = Date.now();
  const entry = store.get(key) as AdminCacheEntry<T> | undefined;

  if (entry && entry.expiresAt > now) {
    if (entry.hasValue) return entry.value as T;
    if (entry.promise) return entry.promise;
  }

  const promise = load()
    .then((value) => {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
        hasValue: true,
      });
      return value;
    })
    .catch((err: unknown) => {
      store.delete(key);
      throw err;
    });

  store.set(key, {
    promise,
    expiresAt: now + ttlMs,
    hasValue: false,
  });

  return promise;
};

export const invalidateAdminDataCache = () => {
  store.clear();
};
