import { Analyzer } from './types';

class AnalyzerRegistry {
  private analyzers = new Map<string, Analyzer>();

  register(analyzer: Analyzer): void {
    this.analyzers.set(analyzer.name, analyzer);
  }

  get(name: string): Analyzer | undefined {
    return this.analyzers.get(name);
  }

  list(): Analyzer[] {
    return Array.from(this.analyzers.values());
  }

  has(name: string): boolean {
    return this.analyzers.has(name);
  }

  clear(): void {
    this.analyzers.clear();
  }
}

export const registry = new AnalyzerRegistry();

// Core no-op placeholder analyzers
export const PodAnalyzer: Analyzer = {
  name: 'Pod',
  analyze: async (_context) => [],
};

export const DeploymentAnalyzer: Analyzer = {
  name: 'Deployment',
  analyze: async (_context) => [],
};

export const ServiceAnalyzer: Analyzer = {
  name: 'Service',
  analyze: async (_context) => [],
};

export const PersistentVolumeClaimAnalyzer: Analyzer = {
  name: 'PersistentVolumeClaim',
  analyze: async (_context) => [],
};

export const NodeAnalyzer: Analyzer = {
  name: 'Node',
  analyze: async (_context) => [],
};

// Register initial core analyzers
registry.register(PodAnalyzer);
registry.register(DeploymentAnalyzer);
registry.register(ServiceAnalyzer);
registry.register(PersistentVolumeClaimAnalyzer);
registry.register(NodeAnalyzer);
