## 2024-10-27 - [Add timeout to AI and fetch external calls]
**Vulnerability:** External fetch calls in AI integrations, custom analyzers, and Discord alerts did not have a timeout configured, exposing the application to DoS risks if the remote service hangs or is slow to respond.
**Learning:** Native `fetch` without `AbortSignal.timeout()` can cause connections to hang indefinitely, tying up resources.
**Prevention:** Always provide an `AbortSignal.timeout()` when making native `fetch` requests to external services.
