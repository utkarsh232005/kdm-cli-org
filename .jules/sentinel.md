## 2024-05-20 - [Fix Path Traversal in File Cache]
**Vulnerability:** Path traversal in `src/cache/file-cache.ts` where users could read/write arbitrary files using `../../` in cache keys.
**Learning:** When implementing a file-based cache provider, any user-provided string used as a cache key must be validated to ensure it does not escape the cache directory constraints.
**Prevention:** Always resolve paths and check that the resolved target path starts with the resolved base directory path.
