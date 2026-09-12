## 2023-11-20 - [Missing input length limits and security headers in local HTTP server]
**Vulnerability:** The local CLI dashboard HTTP server did not limit the length of POST request bodies, introducing a DoS risk. In addition, it lacked basic security headers.
**Learning:** Even local CLI HTTP servers require fundamental HTTP security controls (like payload limits and headers) to prevent exploitation, particularly since they may interact with browsers or external services via custom endpoints.
**Prevention:** Always enforce a request size limit on raw Node.js streams and return generic security headers for JSON API responses.
