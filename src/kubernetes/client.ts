import * as k8s from '@kubernetes/client-node';

let kc: k8s.KubeConfig | null = null;
let k8sApi: k8s.CoreV1Api | null = null;

export const getKubeConfig = (): k8s.KubeConfig => {
  if (!kc) {
    kc = new k8s.KubeConfig();
    try {
      kc.loadFromDefault();
    } catch (e) {
      // Failed to load default config
    }
  }
  return kc;
};

export const getK8sApi = (): k8s.CoreV1Api => {
  if (!k8sApi) {
    const config = getKubeConfig();
    k8sApi = config.makeApiClient(k8s.CoreV1Api);
  }
  return k8sApi;
};

export const checkK8sConnection = async (): Promise<{ connected: boolean; podCount: number }> => {
  try {
    const api = getK8sApi();
    const res = await api.listPodForAllNamespaces();
    const runningPods = res.body.items.filter(pod => pod.status?.phase === 'Running');
    return {
      connected: true,
      podCount: runningPods.length,
    };
  } catch (error) {
    return {
      connected: false,
      podCount: 0,
    };
  }
};
