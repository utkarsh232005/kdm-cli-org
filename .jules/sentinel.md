## 2025-02-27 - [Security Enhancement] Missing fetch timeouts in AI clients
**Vulnerability:** Found `fetch` requests without timeouts in multiple AI provider clients (e.g., `src/ai/openai.ts`).
**Learning:** Native `fetch` in Node.js does not have a default timeout. Failing to set one when calling external services creates hanging connections, exposing the app to Denial of Service (DoS) risks if the AI provider becomes unresponsive.
**Prevention:** Always provide an `AbortSignal.timeout(60000)` (or appropriate timeout) when making native `fetch` requests to external APIs.
