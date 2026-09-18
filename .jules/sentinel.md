## 2024-05-14 - [CRITICAL] Fix Path Traversal in File Cache
**Vulnerability:** The KDM-CLI cache system was vulnerable to an arbitrary file read and delete (Path Traversal / CWE-22) via the `kdm cache get <key>` and `kdm cache remove <key>` commands, allowing users to read or delete sensitive files like `/etc/passwd`.
**Learning:** Even internal caching systems need strict input validation if any part of their key can be influenced by user input (like CLI arguments).
**Prevention:** Always use safe path resolution checks (`resolvedPath.startsWith(resolvedBase + path.sep)`) when concatenating directories with user-provided keys, rather than relying solely on `path.join()`.
