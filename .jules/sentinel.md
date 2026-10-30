## 2024-05-24 - [CRITICAL] Prevent DoS from hanging connections in external API calls
**Vulnerability:** Missing timeouts in native \`fetch\` calls for AI integrations, webhooks, and custom HTTP analyzers.
**Learning:** Native \`fetch\` in Node.js does not have a default timeout, leaving the application susceptible to Denial of Service (DoS) attacks if external dependencies hang indefinitely.
**Prevention:** Always provide an \`AbortSignal.timeout()\` when making native \`fetch\` requests to external services (e.g., 60s for AI services, 10s for webhooks).
