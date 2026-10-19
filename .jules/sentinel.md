## 2023-10-24 - [Fetch Call Timeouts]
**Vulnerability:** Unbounded external network requests via native `fetch` API without a default timeout.
**Learning:** Native `fetch` in Node.js has no default timeout. Without setting one, hanging external endpoints can tie up resources indefinitely leading to DoS.
**Prevention:** Always add `AbortSignal.timeout(duration)` to `fetch` calls, with 60s for slow services (AI) and 10s for fast ones (webhooks).
