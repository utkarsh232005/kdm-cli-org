/**
 * File-based cache provider storing AI responses as individual files
 * in the local filesystem under ~/.config/kdm-cli/cache.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { CacheEntry, CacheProvider, CacheProviderConfig } from './types';

const DEFAULT_CACHE_DIR = path.join(os.homedir(), '.config', 'kdm-cli', 'cache');

/**
 * Resolves the cache directory path from config or defaults.
 * @param config Cache provider configuration.
 * @returns Absolute path to the cache directory.
 */
const resolveCacheDir = (config?: CacheProviderConfig): string =>
  config?.path ?? DEFAULT_CACHE_DIR;

/**
 * Ensures the cache directory exists on disk, creating it recursively if needed.
 * @param dir Absolute path to the cache directory.
 */
const ensureCacheDir = (dir: string): void => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Resolves and validates a cache key to prevent path traversal vulnerabilities.
 * @param cacheDir The base cache directory.
 * @param key The cache key to resolve.
 * @returns The resolved absolute path.
 * @throws Error if the key attempts to traverse outside the cache directory.
 */
const resolveKeyPath = (cacheDir: string, key: string): string => {
  const resolvedPath = path.resolve(cacheDir, key);
  const resolvedCacheDir = path.resolve(cacheDir);
  if (!resolvedPath.startsWith(resolvedCacheDir + path.sep)) {
    throw new Error(`Invalid cache key: path traversal detected`);
  }
  return resolvedPath;
};

/**
 * Safely reads a file as UTF-8, returning null if the file is missing or corrupt.
 * @param filePath Absolute path to the file.
 * @returns File contents or null.
 */
const safeReadFile = (filePath: string): string | null => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
};

/**
 * File-based implementation of the CacheProvider interface.
 * Stores each cached entry as a separate file named by its key.
 */
export class FileCacheProvider implements CacheProvider {
  readonly name = 'file';
  private cacheDir = DEFAULT_CACHE_DIR;

  /**
   * Configures the file cache with the provided settings.
   * @param config Cache provider configuration.
   */
  async configure(config: CacheProviderConfig): Promise<void> {
    this.cacheDir = resolveCacheDir(config);
    ensureCacheDir(this.cacheDir);
  }

  /**
   * Stores AI response text under the given cache key.
   * @param key Cache key (typically a SHA-256 hash).
   * @param data The AI response text.
   */
  async store(key: string, data: string): Promise<void> {
    ensureCacheDir(this.cacheDir);
    const filePath = resolveKeyPath(this.cacheDir, key);
    fs.writeFileSync(filePath, data, 'utf-8');
  }

  /**
   * Loads cached data by key, returning null if not found or corrupt.
   * @param key Cache key.
   * @returns The cached string or null.
   */
  async load(key: string): Promise<string | null> {
    try {
      const filePath = resolveKeyPath(this.cacheDir, key);
      return safeReadFile(filePath);
    } catch {
      return null;
    }
  }

  /**
   * Lists all cache entries with creation time and size metadata.
   * @returns Array of CacheEntry descriptors.
   */
  async list(): Promise<CacheEntry[]> {
    ensureCacheDir(this.cacheDir);
    const files = fs.readdirSync(this.cacheDir);
    return files.map((file) => {
      const filePath = resolveKeyPath(this.cacheDir, file);
      const stat = fs.statSync(filePath);
      return {
        key: file,
        createdAt: stat.birthtime.toISOString(),
        sizeBytes: stat.size,
      };
    });
  }

  /**
   * Removes a single cache entry by key.
   * @param key Cache key to remove.
   */
  async remove(key: string): Promise<void> {
    try {
      const filePath = resolveKeyPath(this.cacheDir, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Ignore invalid keys during removal
    }
  }

  /**
   * Checks whether a cache entry exists.
   * @param key Cache key.
   * @returns True if the file exists.
   */
  async exists(key: string): Promise<boolean> {
    try {
      return fs.existsSync(resolveKeyPath(this.cacheDir, key));
    } catch {
      return false;
    }
  }

  /**
   * Purges all cache entries by removing and recreating the cache directory.
   */
  async purge(): Promise<void> {
    if (fs.existsSync(this.cacheDir)) {
      fs.rmSync(this.cacheDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.cacheDir, { recursive: true });
  }
}
