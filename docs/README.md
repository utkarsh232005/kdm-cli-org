# Documentation (Latest: v2.0.2)

# KDM CLI Documentation - v2.0.2
Published on: 2026-06-12

### 📦 Commits

- test(watch): remove unused afterEach import from vitest
- test(watch): pass interactive option to render and remove process.env.CI hooks
- test(watch): temporarily clear process.env.CI and increase timeout to prevent silent render suppression in CI
- test(watch): add mock isTTY properties to MockWritable to stabilize rendering in CI
- test(watch): refactor duplicated test functions using parameterized it.each to satisfy CodeScene quality gates
- refactor(watch): refine memory limit logic, parse quantity unrecognized suffix fallbacks, and exclude initContainers
- test(watch): stabilize watch-dashboard tests in CI and resolve type issues
- test(watch): add watch-dashboard.test.tsx and expand stats.test.ts to hit >95% patch coverage
- test: add alerts.test.ts and dashboard-utils.test.ts for health monitoring
- feat(watch): implement system resource usage monitoring and live dashboard
- fix(watch): stabilize dashboard-utils and stats tests for v2.0.2 release

---
## Version History

* [what-is-kdm](what-is-kdm.md)
* [v2.0.2](v2.0.2.md)
* [v2.0.1](v2.0.1.md)
* [v2.0.0](v2.0.0.md)
* [v1.2.5](v1.2.5.md)
* [v1.2.3](v1.2.3.md)
* [v1.2.2](v1.2.2.md)
* [v1.2.1](v1.2.1.md)
* [v1.2.0](v1.2.0.md)
* [v1.1.3](v1.1.3.md)
