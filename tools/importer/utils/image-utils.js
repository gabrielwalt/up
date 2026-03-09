/* eslint-disable */

/**
 * Extract the best image URL from an element containing <picture>/<source>/<img>.
 * Resolves relative URLs against baseUrl (from import context) or document.baseURI.
 * Prefers desktop <source> srcset, falls back to <img> srcset/src/data-src.
 */
export function resolveImageSrc(el, document, baseUrl) {
  const base = baseUrl || document.baseURI || document.location?.href || '';

  function resolve(raw) {
    if (!raw) return null;
    const url = raw.split(',')[0].trim().split(/\s+/)[0];
    if (!url) return null;
    if (/^https?:\/\//.test(url)) return url;
    try { return new URL(url, base).href; } catch { /* fall through */ }
    try {
      const origin = new URL(base).origin;
      if (url.startsWith('/')) return origin + url;
    } catch { /* fall through */ }
    return url;
  }

  const picture = el.querySelector('picture');
  if (picture) {
    const sources = picture.querySelectorAll('source');
    for (const source of sources) {
      const srcset = source.getAttribute('srcset') || source.getAttribute('data-srcset');
      const resolved = resolve(srcset);
      if (resolved) return resolved;
    }
  }
  const img = el.querySelector('img');
  if (img) {
    const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset');
    const resolved = resolve(srcset);
    if (resolved) return resolved;
    const src = img.getAttribute('src') || img.getAttribute('data-src');
    if (src) return resolve(src) || src;
    if (img.src) return img.src;
  }
  return null;
}
