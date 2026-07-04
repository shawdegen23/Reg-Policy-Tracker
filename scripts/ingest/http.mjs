// Resilient fetch: retries transient failures (network errors, 5xx, 429) with
// backoff, and aborts hung requests via a timeout. A single blip to LegiScan /
// CARB / CEC used to zero out that source for the whole run — this self-heals.
export async function fetchRetry(url, opts = {}, { tries = 3, timeoutMs = 20000, backoff = 1500 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status >= 500 || res.status === 429) { lastErr = new Error(`HTTP ${res.status}`); }
      else return res; // success (incl. 4xx the caller will handle)
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
    }
    if (i < tries - 1) await new Promise((r) => setTimeout(r, backoff * (i + 1)));
  }
  throw lastErr;
}
