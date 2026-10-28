## 2024-10-28 - Missing Timeouts on fetch calls
**Vulnerability:** External fetch calls (AI providers, webhooks) were missing `AbortSignal.timeout()`.
**Learning:** Native `fetch` in Node.js does not have a default timeout. Unbounded requests can lead to hanging connections and potential Denial of Service (DoS) risks if the external service is slow or unresponsive.
**Prevention:** Always provide an `AbortSignal.timeout()` when making native `fetch` requests to external services (e.g., 60s for AI services, 10s for webhooks, 30s for custom HTTP analyzers).
