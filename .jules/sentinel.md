## 2025-02-25 - Prevent DoS from hanging external API calls
**Vulnerability:** Native `fetch` requests without an `AbortSignal.timeout()` could cause connections to hang indefinitely if external services stop responding, leading to resource exhaustion (DoS).
**Learning:** Node.js native `fetch` doesn't enforce timeouts automatically. This was particularly dangerous in AI service calls and webhooks.
**Prevention:** Always provide an `AbortSignal.timeout()` when making native `fetch` requests to external services (e.g., 60s for AI services, 10s for webhooks).
