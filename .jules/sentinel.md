## 2026-09-11 - Sensitive Notification Secrets Exposure in /config Endpoint
**Vulnerability:** The application exposed `discordWebhook` and `emailPassword` credentials in the `/config` HTTP endpoint response.
**Learning:** While the application attempted to redact AI provider passwords, the configuration block for `notifications` was overlooked, causing it to return unmasked secrets to any requester that had access to the endpoint.
**Prevention:** Ensure that any endpoint that serves configuration data recursively scrubs or specifically masks all known sensitive blocks, including newly added ones.
