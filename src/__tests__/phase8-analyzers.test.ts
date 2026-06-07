/**
 * Comprehensive unit tests for Phase 8 Kubernetes analyzers.
 * Covers failure detection, healthy-resource green paths, API failure propagation,
 * result metadata (kind/name/namespace), and edge cases for every analyzer.
 *
 * Follows coding_style.md rules:
 *   - it.each parameterized testing to avoid structural duplication
 *   - JSDoc coverage on test utilities and describe blocks
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  listReplicaSets,
  listStatefulSets,
  listDaemonSets,
  listJobs,
  listCronJobs,
  listIngresses,
  listConfigMaps,
  listHPAs,
  listPDBs,
  listNetworkPolicies,
  listEvents,
  listPods,
  listStorageClasses,
  listPersistentVolumeClaims,
  listGatewayClasses,
  listGateways,
  listHTTPRoutes,
  readPodLog,
} from '../kubernetes/resources';
import {
  ReplicaSetAnalyzer,
  StatefulSetAnalyzer,
  DaemonSetAnalyzer,
  JobAnalyzer,
  CronJobAnalyzer,
  IngressAnalyzer,
  ConfigMapAnalyzer,
  HPAAnalyzer,
  PDBAnalyzer,
  NetworkPolicyAnalyzer,
  EventsAnalyzer,
  StorageAnalyzer,
  GatewayClassAnalyzer,
  GatewayAnalyzer,
  HTTPRouteAnalyzer,
} from '../analyzers';
import { SecurityAnalyzer } from '../analyzers/security';
import { LogAnalyzer } from '../analyzers/log-analyzer';

vi.mock('../kubernetes/resources', () => ({
  listPods: vi.fn(async () => []),
  listDeployments: vi.fn(async () => []),
  listServices: vi.fn(async () => []),
  listPersistentVolumeClaims: vi.fn(async () => []),
  listNodes: vi.fn(async () => []),
  listReplicaSets: vi.fn(async () => []),
  listStatefulSets: vi.fn(async () => []),
  listDaemonSets: vi.fn(async () => []),
  listJobs: vi.fn(async () => []),
  listCronJobs: vi.fn(async () => []),
  listIngresses: vi.fn(async () => []),
  listConfigMaps: vi.fn(async () => []),
  listHPAs: vi.fn(async () => []),
  listPDBs: vi.fn(async () => []),
  listNetworkPolicies: vi.fn(async () => []),
  listEvents: vi.fn(async () => []),
  listStorageClasses: vi.fn(async () => []),
  listGatewayClasses: vi.fn(async () => []),
  listGateways: vi.fn(async () => []),
  listHTTPRoutes: vi.fn(async () => []),
  readEndpoints: vi.fn(async () => undefined),
  readPodLog: vi.fn(async () => ''),
  labelsToSelector: (labels: Record<string, string> = {}) =>
    Object.entries(labels).map(([key, value]) => `${key}=${value}`).join(','),
}));

/**
 * Joins all error text from an AnalyzerResult array into a single string for assertion.
 * @param results Array of analyzer results.
 * @returns Concatenated error text.
 */
const joinErrors = (results: any[]): string =>
  results.flatMap((r: any) => r.errors.map((e: any) => e.text)).join('\n');

/**
 * Interface configuring the verifyAnalyzerFailure helper.
 */
interface VerifyFailureParams {
  analyzer: any;
  listFn: any;
  mockValue: any;
  expectedKind: string;
  expectedName: string;
  expectedNamespace?: string;
  assertErrors: (errors: string) => void;
}

/**
 * Helper to dry up duplicate analyzer failure tests.
 */
const verifyAnalyzerFailure = async (params: VerifyFailureParams): Promise<void> => {
  vi.mocked(params.listFn).mockResolvedValueOnce(params.mockValue);
  const results = await params.analyzer.analyze({});
  expect(results).toHaveLength(1);
  expect(results[0].kind).toBe(params.expectedKind);
  expect(results[0].name).toBe(params.expectedName);
  if (params.expectedNamespace) {
    expect(results[0].namespace).toBe(params.expectedNamespace);
  }
  params.assertErrors(joinErrors(results));
};

// ─── ReplicaSet Analyzer ───────────────────────────────────────────

describe('ReplicaSetAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects insufficient ready replicas and reports correct metadata', async () => {
    await verifyAnalyzerFailure({
      analyzer: ReplicaSetAnalyzer,
      listFn: listReplicaSets,
      mockValue: [{
        metadata: { name: 'api-rs', namespace: 'production' },
        spec: { replicas: 5 },
        status: { readyReplicas: 2 },
      }],
      expectedKind: 'ReplicaSet',
      expectedName: 'api-rs',
      expectedNamespace: 'production',
      assertErrors: (errors) => expect(errors).toContain('2/5 ready replicas'),
    });
  });

  it('detects condition failures with message text', async () => {
    await verifyAnalyzerFailure({
      analyzer: ReplicaSetAnalyzer,
      listFn: listReplicaSets,
      mockValue: [{
        metadata: { name: 'rs-cond', namespace: 'default' },
        spec: { replicas: 1 },
        status: {
          readyReplicas: 1,
          conditions: [
            { type: 'ReplicaFailure', status: 'False', message: 'quota exceeded' },
          ],
        },
      }],
      expectedKind: 'ReplicaSet',
      expectedName: 'rs-cond',
      expectedNamespace: 'default',
      assertErrors: (errors) => {
        expect(errors).toContain('ReplicaFailure');
        expect(errors).toContain('quota exceeded');
      },
    });
  });

  it('skips ReplicaSets with zero desired replicas', async () => {
    vi.mocked(listReplicaSets).mockResolvedValueOnce([{
      metadata: { name: 'scaled-down', namespace: 'default' },
      spec: { replicas: 0 },
      status: { readyReplicas: 0 },
    } as any]);

    await expect(ReplicaSetAnalyzer.analyze({})).resolves.toEqual([]);
  });
});

// ─── StatefulSet Analyzer ──────────────────────────────────────────

describe('StatefulSetAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects insufficient ready replicas and reports correct metadata', async () => {
    await verifyAnalyzerFailure({
      analyzer: StatefulSetAnalyzer,
      listFn: listStatefulSets,
      mockValue: [{
        metadata: { name: 'redis', namespace: 'cache' },
        spec: { replicas: 3 },
        status: { readyReplicas: 0 },
      }],
      expectedKind: 'StatefulSet',
      expectedName: 'redis',
      expectedNamespace: 'cache',
      assertErrors: (errors) => expect(errors).toContain('0/3 ready replicas'),
    });
  });
});

// ─── DaemonSet Analyzer ────────────────────────────────────────────

describe('DaemonSetAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects both unavailable and misscheduled pods', async () => {
    await verifyAnalyzerFailure({
      analyzer: DaemonSetAnalyzer,
      listFn: listDaemonSets,
      mockValue: [{
        metadata: { name: 'fluentd', namespace: 'logging' },
        status: { desiredNumberScheduled: 5, numberReady: 3, numberMisscheduled: 2 },
      }],
      expectedKind: 'DaemonSet',
      expectedName: 'fluentd',
      expectedNamespace: 'logging',
      assertErrors: (errors) => {
        expect(errors).toContain('3/5 ready pods');
        expect(errors).toContain('2 misscheduled pods');
      },
    });
  });
});

// ─── Job Analyzer ──────────────────────────────────────────────────

describe('JobAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects failed pods, failure condition, and backoff limit exceeded', async () => {
    await verifyAnalyzerFailure({
      analyzer: JobAnalyzer,
      listFn: listJobs,
      mockValue: [{
        metadata: { name: 'etl-job', namespace: 'batch' },
        spec: { backoffLimit: 3 },
        status: {
          failed: 3,
          conditions: [{ type: 'Failed', status: 'True', reason: 'BackoffLimitExceeded', message: 'Job reached backoff limit' }],
        },
      }],
      expectedKind: 'Job',
      expectedName: 'etl-job',
      expectedNamespace: 'batch',
      assertErrors: (errors) => {
        expect(errors).toContain('3 failed pods');
        expect(errors).toContain('BackoffLimitExceeded');
        expect(errors).toContain('exceeded backoff limit');
      },
    });
  });

  it('uses singular "pod" for single failure', async () => {
    await verifyAnalyzerFailure({
      analyzer: JobAnalyzer,
      listFn: listJobs,
      mockValue: [{
        metadata: { name: 'one-fail', namespace: 'default' },
        spec: { backoffLimit: 6 },
        status: { failed: 1 },
      }],
      expectedKind: 'Job',
      expectedName: 'one-fail',
      expectedNamespace: 'default',
      assertErrors: (errors) => expect(errors).toBe('Job has 1 failed pod'),
    });
  });
});

// ─── CronJob Analyzer ──────────────────────────────────────────────

describe('CronJobAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects suspended CronJob', async () => {
    await verifyAnalyzerFailure({
      analyzer: CronJobAnalyzer,
      listFn: listCronJobs,
      mockValue: [{
        metadata: { name: 'backup', namespace: 'ops' },
        spec: { schedule: '0 2 * * *', suspend: true },
      }],
      expectedKind: 'CronJob',
      expectedName: 'backup',
      expectedNamespace: 'ops',
      assertErrors: (errors) => expect(errors).toContain('suspended'),
    });
  });

  it('detects CronJob with no schedule', async () => {
    await verifyAnalyzerFailure({
      analyzer: CronJobAnalyzer,
      listFn: listCronJobs,
      mockValue: [{
        metadata: { name: 'no-sched', namespace: 'default' },
        spec: {},
      }],
      expectedKind: 'CronJob',
      expectedName: 'no-sched',
      expectedNamespace: 'default',
      assertErrors: (errors) => expect(errors).toContain('no schedule defined'),
    });
  });
});

// ─── Ingress Analyzer ──────────────────────────────────────────────

describe('IngressAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects Ingress with no rules', async () => {
    await verifyAnalyzerFailure({
      analyzer: IngressAnalyzer,
      listFn: listIngresses,
      mockValue: [{
        metadata: { name: 'empty-ing', namespace: 'web' },
        spec: {},
      }],
      expectedKind: 'Ingress',
      expectedName: 'empty-ing',
      expectedNamespace: 'web',
      assertErrors: (errors) => expect(errors).toContain('no rules defined'),
    });
  });

  it('detects hosts without TLS configuration', async () => {
    await verifyAnalyzerFailure({
      analyzer: IngressAnalyzer,
      listFn: listIngresses,
      mockValue: [{
        metadata: { name: 'no-tls', namespace: 'default' },
        spec: {
          rules: [{ host: 'api.example.com', http: { paths: [{ path: '/', backend: { service: { name: 'api' } } }] } }],
        },
      }],
      expectedKind: 'Ingress',
      expectedName: 'no-tls',
      expectedNamespace: 'default',
      assertErrors: (errors) => expect(errors).toContain('hosts but no TLS'),
    });
  });

  it('detects missing backend service on a rule path', async () => {
    await verifyAnalyzerFailure({
      analyzer: IngressAnalyzer,
      listFn: listIngresses,
      mockValue: [{
        metadata: { name: 'bad-backend', namespace: 'default' },
        spec: {
          rules: [{ host: 'app.test', http: { paths: [{ path: '/api', backend: {} }] } }],
        },
      }],
      expectedKind: 'Ingress',
      expectedName: 'bad-backend',
      expectedNamespace: 'default',
      assertErrors: (errors) => expect(errors).toContain('no backend service'),
    });
  });
});

// ─── ConfigMap Analyzer ────────────────────────────────────────────

describe('ConfigMapAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects empty ConfigMap with no data keys', async () => {
    await verifyAnalyzerFailure({
      analyzer: ConfigMapAnalyzer,
      listFn: listConfigMaps,
      mockValue: [{
        metadata: { name: 'empty-cm', namespace: 'default' },
      }],
      expectedKind: 'ConfigMap',
      expectedName: 'empty-cm',
      expectedNamespace: 'default',
      assertErrors: (errors) => expect(errors).toContain('no data keys'),
    });
  });
});

// ─── HPA Analyzer ──────────────────────────────────────────────────

describe('HPAAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects HPA at maximum replicas', async () => {
    await verifyAnalyzerFailure({
      analyzer: HPAAnalyzer,
      listFn: listHPAs,
      mockValue: [{
        metadata: { name: 'web-hpa', namespace: 'production' },
        spec: { maxReplicas: 10 },
        status: { currentReplicas: 10 },
      }],
      expectedKind: 'HorizontalPodAutoscaler',
      expectedName: 'web-hpa',
      expectedNamespace: 'production',
      assertErrors: (errors) => expect(errors).toContain('maximum replicas (10/10)'),
    });
  });

  it('detects ScalingLimited and AbleToScale=False conditions', async () => {
    await verifyAnalyzerFailure({
      analyzer: HPAAnalyzer,
      listFn: listHPAs,
      mockValue: [{
        metadata: { name: 'limited-hpa', namespace: 'default' },
        spec: { maxReplicas: 20 },
        status: {
          currentReplicas: 5,
          conditions: [
            { type: 'ScalingLimited', status: 'True', message: 'at max' },
            { type: 'AbleToScale', status: 'False', message: 'no metrics' },
          ],
        },
      }],
      expectedKind: 'HorizontalPodAutoscaler',
      expectedName: 'limited-hpa',
      expectedNamespace: 'default',
      assertErrors: (errors) => {
        expect(errors).toContain('scaling limited');
        expect(errors).toContain('unable to scale');
      },
    });
  });
});

// ─── PDB Analyzer ──────────────────────────────────────────────────

describe('PDBAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects zero disruptions allowed and unhealthy pods', async () => {
    await verifyAnalyzerFailure({
      analyzer: PDBAnalyzer,
      listFn: listPDBs,
      mockValue: [{
        metadata: { name: 'api-pdb', namespace: 'default' },
        status: { disruptionsAllowed: 0, expectedPods: 3, currentHealthy: 2 },
      }],
      expectedKind: 'PodDisruptionBudget',
      expectedName: 'api-pdb',
      expectedNamespace: 'default',
      assertErrors: (errors) => {
        expect(errors).toContain('zero disruptions');
        expect(errors).toContain('2/3 healthy pods');
      },
    });
  });
});

// ─── NetworkPolicy Analyzer ────────────────────────────────────────

describe('NetworkPolicyAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects empty podSelector and missing ingress rules', async () => {
    await verifyAnalyzerFailure({
      analyzer: NetworkPolicyAnalyzer,
      listFn: listNetworkPolicies,
      mockValue: [{
        metadata: { name: 'deny-all', namespace: 'secure' },
        spec: { podSelector: {}, policyTypes: ['Ingress'], ingress: [] },
      }],
      expectedKind: 'NetworkPolicy',
      expectedName: 'deny-all',
      expectedNamespace: 'secure',
      assertErrors: (errors) => {
        expect(errors).toContain('empty podSelector');
        expect(errors).toContain('blocks all ingress');
      },
    });
  });

  it('detects missing egress rules when Egress policy declared', async () => {
    await verifyAnalyzerFailure({
      analyzer: NetworkPolicyAnalyzer,
      listFn: listNetworkPolicies,
      mockValue: [{
        metadata: { name: 'no-egress', namespace: 'default' },
        spec: {
          podSelector: { matchLabels: { app: 'web' } },
          policyTypes: ['Egress'],
          egress: [],
        },
      }],
      expectedKind: 'NetworkPolicy',
      expectedName: 'no-egress',
      expectedNamespace: 'default',
      assertErrors: (errors) => expect(errors).toContain('blocks all egress'),
    });
  });
});

// ─── Events Analyzer ───────────────────────────────────────────────

describe('EventsAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects Warning events and captures involvedObject metadata', async () => {
    await verifyAnalyzerFailure({
      analyzer: EventsAnalyzer,
      listFn: listEvents,
      mockValue: [{
        metadata: { name: 'evt-1', namespace: 'kube-system' },
        type: 'Warning',
        reason: 'FailedScheduling',
        message: 'Insufficient cpu',
        involvedObject: { name: 'my-pod', kind: 'Pod' },
      }],
      expectedKind: 'Event',
      expectedName: 'my-pod',
      expectedNamespace: 'kube-system',
      assertErrors: (errors) => {
        expect(errors).toContain('FailedScheduling');
        expect(errors).toContain('Insufficient cpu');
      },
    });
  });
});

// ─── Storage Analyzer ──────────────────────────────────────────────

describe('StorageAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects StorageClass with no provisioner', async () => {
    await verifyAnalyzerFailure({
      analyzer: StorageAnalyzer,
      listFn: listStorageClasses,
      mockValue: [{
        metadata: { name: 'bad-sc' },
      }],
      expectedKind: 'Storage',
      expectedName: 'bad-sc',
      assertErrors: (errors) => expect(errors).toContain('no provisioner'),
    });
  });

  it('detects PVC referencing non-existent StorageClass', async () => {
    vi.mocked(listStorageClasses).mockResolvedValueOnce([{
      metadata: { name: 'gp2' },
      provisioner: 'ebs.csi.aws.com',
    } as any]);
    await verifyAnalyzerFailure({
      analyzer: StorageAnalyzer,
      listFn: listPersistentVolumeClaims,
      mockValue: [{
        metadata: { name: 'orphan-pvc', namespace: 'default' },
        spec: { storageClassName: 'deleted-class' },
      }],
      expectedKind: 'Storage',
      expectedName: 'orphan-pvc',
      expectedNamespace: 'default',
      assertErrors: (errors) => expect(errors).toContain("'deleted-class' which does not exist"),
    });
  });
});

// ─── Security Analyzer ─────────────────────────────────────────────

describe('SecurityAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects root user, privileged mode, and missing readOnlyRootFilesystem', async () => {
    await verifyAnalyzerFailure({
      analyzer: SecurityAnalyzer,
      listFn: listPods,
      mockValue: [{
        metadata: { name: 'insecure-pod', namespace: 'default' },
        spec: {
          containers: [{
            name: 'app',
            securityContext: { privileged: true },
          }],
        },
      }],
      expectedKind: 'Security',
      expectedName: 'insecure-pod',
      expectedNamespace: 'default',
      assertErrors: (errors) => {
        expect(errors).toContain('may run as root');
        expect(errors).toContain('privileged mode');
        expect(errors).toContain('read-only root filesystem');
      },
    });
  });
});

// ─── Log Analyzer ──────────────────────────────────────────────────

describe('LogAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects ERROR patterns in unhealthy pod logs', async () => {
    vi.mocked(listPods).mockResolvedValueOnce([{
      metadata: { name: 'crash-pod', namespace: 'default' },
      status: {
        phase: 'Running',
        containerStatuses: [{ name: 'app', ready: false }],
      },
      spec: { containers: [{ name: 'app' }] },
    } as any]);
    vi.mocked(readPodLog).mockResolvedValueOnce(
      'INFO: starting\nERROR: connection refused\nFATAL: shutting down',
    );

    const results = await LogAnalyzer.analyze({});

    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe('Log');
    expect(results[0].name).toBe('crash-pod');
    const errors = joinErrors(results);
    expect(errors).toContain('ERROR: connection refused');
    expect(errors).toContain('FATAL: shutting down');
  });

  it('skips healthy pods entirely', async () => {
    vi.mocked(listPods).mockResolvedValueOnce([{
      metadata: { name: 'ok-pod', namespace: 'default' },
      status: { phase: 'Running', containerStatuses: [{ name: 'app', ready: true }] },
      spec: { containers: [{ name: 'app' }] },
    } as any]);

    await expect(LogAnalyzer.analyze({})).resolves.toEqual([]);
    expect(readPodLog).not.toHaveBeenCalled();
  });
});

// ─── Gateway API Analyzers ─────────────────────────────────────────

describe('GatewayClassAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects GatewayClass not accepted with reason', async () => {
    await verifyAnalyzerFailure({
      analyzer: GatewayClassAnalyzer,
      listFn: listGatewayClasses,
      mockValue: [{
        metadata: { name: 'istio' },
        status: { conditions: [{ type: 'Accepted', status: 'False', reason: 'InvalidConfig', message: 'bad params' }] },
      }],
      expectedKind: 'GatewayClass',
      expectedName: 'istio',
      assertErrors: (errors) => {
        expect(errors).toContain('not accepted');
        expect(errors).toContain('InvalidConfig');
      },
    });
  });
});

describe('GatewayAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects Gateway with no listeners and not-programmed condition', async () => {
    await verifyAnalyzerFailure({
      analyzer: GatewayAnalyzer,
      listFn: listGateways,
      mockValue: [{
        metadata: { name: 'main-gw', namespace: 'istio-system' },
        spec: {},
        status: { conditions: [{ type: 'Programmed', status: 'False', reason: 'AddressNotAssigned' }] },
      }],
      expectedKind: 'Gateway',
      expectedName: 'main-gw',
      expectedNamespace: 'istio-system',
      assertErrors: (errors) => {
        expect(errors).toContain('no listeners');
        expect(errors).toContain('not programmed');
      },
    });
  });
});

describe('HTTPRouteAnalyzer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('detects HTTPRoute not accepted by parent and missing backend refs', async () => {
    await verifyAnalyzerFailure({
      analyzer: HTTPRouteAnalyzer,
      listFn: listHTTPRoutes,
      mockValue: [{
        metadata: { name: 'api-route', namespace: 'default' },
        spec: { rules: [{ backendRefs: [] }] },
        status: { parents: [{ conditions: [{ type: 'Accepted', status: 'False', reason: 'NoMatchingParent' }] }] },
      }],
      expectedKind: 'HTTPRoute',
      expectedName: 'api-route',
      expectedNamespace: 'default',
      assertErrors: (errors) => {
        expect(errors).toContain('not accepted');
        expect(errors).toContain('no backend references');
      },
    });
  });
});

// ─── Parameterized: Empty Input Returns Empty Results ──────────────

describe('Phase 8 analyzers — empty resource lists', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    { name: 'ReplicaSet', analyzer: ReplicaSetAnalyzer },
    { name: 'StatefulSet', analyzer: StatefulSetAnalyzer },
    { name: 'DaemonSet', analyzer: DaemonSetAnalyzer },
    { name: 'Job', analyzer: JobAnalyzer },
    { name: 'CronJob', analyzer: CronJobAnalyzer },
    { name: 'Ingress', analyzer: IngressAnalyzer },
    { name: 'ConfigMap', analyzer: ConfigMapAnalyzer },
    { name: 'HPA', analyzer: HPAAnalyzer },
    { name: 'PDB', analyzer: PDBAnalyzer },
    { name: 'NetworkPolicy', analyzer: NetworkPolicyAnalyzer },
    { name: 'Events', analyzer: EventsAnalyzer },
    { name: 'Security', analyzer: SecurityAnalyzer },
    { name: 'Log', analyzer: LogAnalyzer },
    { name: 'GatewayClass', analyzer: GatewayClassAnalyzer },
    { name: 'Gateway', analyzer: GatewayAnalyzer },
    { name: 'HTTPRoute', analyzer: HTTPRouteAnalyzer },
  ])('$name analyzer returns empty when no resources exist', async ({ analyzer }) => {
    await expect(analyzer.analyze({})).resolves.toEqual([]);
  });
});

// ─── Parameterized: API Failure Propagation ────────────────────────

describe('Phase 8 analyzers — API failure propagation', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    { name: 'ReplicaSet', listFn: listReplicaSets, analyzer: ReplicaSetAnalyzer },
    { name: 'StatefulSet', listFn: listStatefulSets, analyzer: StatefulSetAnalyzer },
    { name: 'DaemonSet', listFn: listDaemonSets, analyzer: DaemonSetAnalyzer },
    { name: 'Job', listFn: listJobs, analyzer: JobAnalyzer },
    { name: 'CronJob', listFn: listCronJobs, analyzer: CronJobAnalyzer },
    { name: 'Ingress', listFn: listIngresses, analyzer: IngressAnalyzer },
    { name: 'ConfigMap', listFn: listConfigMaps, analyzer: ConfigMapAnalyzer },
    { name: 'HPA', listFn: listHPAs, analyzer: HPAAnalyzer },
    { name: 'PDB', listFn: listPDBs, analyzer: PDBAnalyzer },
    { name: 'NetworkPolicy', listFn: listNetworkPolicies, analyzer: NetworkPolicyAnalyzer },
    { name: 'Events', listFn: listEvents, analyzer: EventsAnalyzer },
    { name: 'GatewayClass', listFn: listGatewayClasses, analyzer: GatewayClassAnalyzer },
    { name: 'Gateway', listFn: listGateways, analyzer: GatewayAnalyzer },
    { name: 'HTTPRoute', listFn: listHTTPRoutes, analyzer: HTTPRouteAnalyzer },
  ])('$name analyzer propagates API failure', async ({ listFn, analyzer }) => {
    vi.mocked(listFn as any).mockRejectedValueOnce(new Error('API timeout'));
    await expect(analyzer.analyze({})).rejects.toThrow('API timeout');
  });
});

// ─── Parameterized: Healthy Resource Green Paths ──────────────────

describe('Phase 8 analyzers — healthy resource green paths', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    {
      name: 'ReplicaSet',
      analyzer: ReplicaSetAnalyzer,
      setup: () => vi.mocked(listReplicaSets).mockResolvedValueOnce([{
        metadata: { name: 'healthy-rs', namespace: 'default' },
        spec: { replicas: 3 },
        status: { readyReplicas: 3 },
      } as any]),
    },
    {
      name: 'StatefulSet',
      analyzer: StatefulSetAnalyzer,
      setup: () => vi.mocked(listStatefulSets).mockResolvedValueOnce([{
        metadata: { name: 'healthy-ss', namespace: 'default' },
        spec: { replicas: 2 },
        status: { readyReplicas: 2 },
      } as any]),
    },
    {
      name: 'DaemonSet',
      analyzer: DaemonSetAnalyzer,
      setup: () => vi.mocked(listDaemonSets).mockResolvedValueOnce([{
        metadata: { name: 'healthy-ds', namespace: 'default' },
        status: { desiredNumberScheduled: 3, numberReady: 3, numberMisscheduled: 0 },
      } as any]),
    },
    {
      name: 'Job',
      analyzer: JobAnalyzer,
      setup: () => vi.mocked(listJobs).mockResolvedValueOnce([{
        metadata: { name: 'done-job', namespace: 'default' },
        spec: { backoffLimit: 6 },
        status: { succeeded: 1, conditions: [{ type: 'Complete', status: 'True' }] },
      } as any]),
    },
    {
      name: 'CronJob',
      analyzer: CronJobAnalyzer,
      setup: () => vi.mocked(listCronJobs).mockResolvedValueOnce([{
        metadata: { name: 'healthy-cj', namespace: 'default' },
        spec: { schedule: '*/5 * * * *', suspend: false },
      } as any]),
    },
    {
      name: 'Ingress',
      analyzer: IngressAnalyzer,
      setup: () => vi.mocked(listIngresses).mockResolvedValueOnce([{
        metadata: { name: 'good-ing', namespace: 'default' },
        spec: {
          tls: [{ hosts: ['app.example.com'], secretName: 'tls-secret' }],
          rules: [{ host: 'app.example.com', http: { paths: [{ path: '/', backend: { service: { name: 'app' } } }] } }],
        },
      } as any]),
    },
    {
      name: 'ConfigMap with data',
      analyzer: ConfigMapAnalyzer,
      setup: () => vi.mocked(listConfigMaps).mockResolvedValueOnce([{
        metadata: { name: 'app-config', namespace: 'default' },
        data: { 'config.yaml': 'key: value' },
      } as any]),
    },
    {
      name: 'ConfigMap with binary data',
      analyzer: ConfigMapAnalyzer,
      setup: () => vi.mocked(listConfigMaps).mockResolvedValueOnce([{
        metadata: { name: 'certs', namespace: 'default' },
        binaryData: { 'ca.crt': 'base64data' },
      } as any]),
    },
    {
      name: 'HPA',
      analyzer: HPAAnalyzer,
      setup: () => vi.mocked(listHPAs).mockResolvedValueOnce([{
        metadata: { name: 'ok-hpa', namespace: 'default' },
        spec: { maxReplicas: 10 },
        status: { currentReplicas: 5 },
      } as any]),
    },
    {
      name: 'PDB',
      analyzer: PDBAnalyzer,
      setup: () => vi.mocked(listPDBs).mockResolvedValueOnce([{
        metadata: { name: 'ok-pdb', namespace: 'default' },
        status: { disruptionsAllowed: 1, expectedPods: 3, currentHealthy: 3 },
      } as any]),
    },
    {
      name: 'NetworkPolicy',
      analyzer: NetworkPolicyAnalyzer,
      setup: () => vi.mocked(listNetworkPolicies).mockResolvedValueOnce([{
        metadata: { name: 'allow-web', namespace: 'default' },
        spec: {
          podSelector: { matchLabels: { app: 'web' } },
          policyTypes: ['Ingress'],
          ingress: [{ from: [{ podSelector: { matchLabels: { role: 'api' } } }] }],
        },
      } as any]),
    },
    {
      name: 'Events with normal type',
      analyzer: EventsAnalyzer,
      setup: () => vi.mocked(listEvents).mockResolvedValueOnce([{
        metadata: { name: 'evt-normal', namespace: 'default' },
        type: 'Normal',
        reason: 'Scheduled',
        message: 'Successfully assigned',
        involvedObject: { name: 'pod-1', kind: 'Pod' },
      } as any]),
    },
    {
      name: 'Storage',
      analyzer: StorageAnalyzer,
      setup: () => {
        vi.mocked(listStorageClasses).mockResolvedValueOnce([{
          metadata: { name: 'gp2' },
          provisioner: 'ebs.csi.aws.com',
        } as any]);
        vi.mocked(listPersistentVolumeClaims).mockResolvedValueOnce([{
          metadata: { name: 'data-pvc', namespace: 'default' },
          spec: { storageClassName: 'gp2' },
        } as any]);
      },
    },
    {
      name: 'Security hardened Pod',
      analyzer: SecurityAnalyzer,
      setup: () => vi.mocked(listPods).mockResolvedValueOnce([{
        metadata: { name: 'secure-pod', namespace: 'default' },
        spec: {
          securityContext: { runAsNonRoot: true },
          containers: [{
            name: 'app',
            securityContext: { readOnlyRootFilesystem: true },
          }],
        },
      } as any]),
    },
    {
      name: 'Log with healthy logs',
      analyzer: LogAnalyzer,
      setup: () => {
        vi.mocked(listPods).mockResolvedValueOnce([{
          metadata: { name: 'slow-pod', namespace: 'default' },
          status: { phase: 'Failed' },
          spec: { containers: [{ name: 'worker' }] },
        } as any]);
        vi.mocked(readPodLog).mockResolvedValueOnce('INFO: processing\nDEBUG: complete');
      },
    },
    {
      name: 'GatewayClass',
      analyzer: GatewayClassAnalyzer,
      setup: () => vi.mocked(listGatewayClasses).mockResolvedValueOnce([{
        metadata: { name: 'envoy' },
        status: { conditions: [{ type: 'Accepted', status: 'True' }] },
      } as any]),
    },
    {
      name: 'Gateway',
      analyzer: GatewayAnalyzer,
      setup: () => vi.mocked(listGateways).mockResolvedValueOnce([{
        metadata: { name: 'ok-gw', namespace: 'default' },
        spec: { listeners: [{ port: 80, protocol: 'HTTP' }] },
        status: { conditions: [{ type: 'Accepted', status: 'True' }, { type: 'Programmed', status: 'True' }] },
      } as any]),
    },
    {
      name: 'HTTPRoute',
      analyzer: HTTPRouteAnalyzer,
      setup: () => vi.mocked(listHTTPRoutes).mockResolvedValueOnce([{
        metadata: { name: 'ok-route', namespace: 'default' },
        spec: { rules: [{ backendRefs: [{ name: 'api-svc' }] }] },
        status: { parents: [{ conditions: [{ type: 'Accepted', status: 'True' }] }] },
      } as any]),
    },
  ])('$name green path returns empty results', async ({ analyzer, setup }) => {
    setup();
    const results = await analyzer.analyze({});
    expect(results).toEqual([]);
  });
});
