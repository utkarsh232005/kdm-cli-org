## 2026-10-22 - Prevent command injection by avoiding exec
**Vulnerability:** Use of `child_process.exec` for internal commands.
**Learning:** While some were hardcoded internal commands, using `exec` spawns a shell and is a general security risk. Note that `exec` MUST be kept for user-configurable custom analyzers where users expect shell pipelines, making this a nuanced codebase constraint.
**Prevention:** Prefer `child_process.execFile` or `spawn` instead of `exec` for non-user-supplied commands.
