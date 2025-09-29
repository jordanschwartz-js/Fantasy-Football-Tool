const CACHE_VERSION = 'ff-assistant-v1';
const MAX_REPORTS = 6;

function getBasePath() {
  try {
    if (self.registration && self.registration.scope) {
      const scopeUrl = new URL(self.registration.scope);
      const pathname = scopeUrl.pathname;
      return pathname.endsWith('/') ? pathname : `${pathname}/`;
    }
  } catch (err) {
    /* no-op */
  }
  return '/';
}

const BASE_PATH = getBasePath();
const NORMALIZED_BASE = BASE_PATH === '' ? '/' : BASE_PATH;

function normalizePath(path) {
  const trimmed = (path || '').replace(/^\/+/, '');
  if (!trimmed) {
    return NORMALIZED_BASE === '/' ? '/' : NORMALIZED_BASE;
  }
  if (NORMALIZED_BASE === '/' || NORMALIZED_BASE === '') {
    return `/${trimmed}`;
  }
  return `${NORMALIZED_BASE}${trimmed}`.replace(/\/{2,}/g, '/');
}

function toAbsoluteUrl(path) {
  return new URL(path, self.location.origin).href;
}

const CORE_PATHS = ['','index.html','assets/style.css','assets/app.js','manifest.json','BASE.json','sw.js'];
const CORE_URLS = Array.from(new Set(
  CORE_PATHS.map((entry) => {
    if (!entry) {
      const base = NORMALIZED_BASE === '/' ? '/' : NORMALIZED_BASE;
      return toAbsoluteUrl(base);
    }
    return toAbsoluteUrl(normalizePath(entry));
  })
));
const CORE_URL_SET = new Set(CORE_URLS);

function shouldCache(url) {
  let target;
  try {
    target = new URL(url);
  } catch (err) {
    return false;
  }
  if (target.origin !== self.location.origin) {
    return false;
  }
  if (CORE_URL_SET.has(target.href)) {
    return true;
  }
  if (/\/reports\/.*\.json$/i.test(target.pathname)) {
    return true;
  }
  return false;
}

async function trimReportCache(cache) {
  const keys = await cache.keys();
  const reports = keys
    .filter((request) => {
      try {
        const url = new URL(request.url);
        return /\/reports\/.*\.json$/i.test(url.pathname);
      } catch (err) {
        return false;
      }
    })
    .map((request) => {
      const url = new URL(request.url);
      const match = url.pathname.match(/_week_(\d+)/i);
      return { request, week: match ? parseInt(match[1], 10) : 0 };
    })
    .sort((a, b) => b.week - a.week);
  reports.slice(MAX_REPORTS).forEach(({ request }) => cache.delete(request));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !shouldCache(request.url)) {
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request)
        .then((response) => {
          if (!response || !response.ok) {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, clone);
            trimReportCache(cache);
          });
          return response;
        })
        .catch(() => cached);
    })
  );
});
