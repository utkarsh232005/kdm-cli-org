## 2025-02-21 - Path Traversal in File Cache

**Vulnerability:** A path traversal vulnerability exists in the `FileCacheProvider` (`src/cache/file-cache.ts`). Cache keys are not sanitized, and arbitrary file paths could be provided, allowing users (or attackers) to read or write sensitive files on the system outside of the intended cache directory (e.g., `kdm cache get ../../../../../etc/passwd`).

**Learning:** When generating paths dynamically using user input, combining `path.join` with unchecked input can easily lead to a directory traversal. Relying solely on `path.join(this.cacheDir, key)` without verifying that the resolved path is still within `this.cacheDir` is unsafe.

**Prevention:** Always validate that any path generated from user input resides strictly within the intended base directory. This can be achieved by using `path.resolve` and checking if the resulting path starts with the resolved base directory.
