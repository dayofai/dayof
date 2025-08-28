/**
 * Minimal bounded cache - just prevents unbounded growth
 * No TTL needed since we already do DB timestamp validation
 */

const DEFAULT_MAX_SIZE = 100;

/**
 * Simple Map wrapper that prevents unbounded growth via FIFO eviction
 */
export class BoundedMap<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize = DEFAULT_MAX_SIZE) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V): this {
    // If adding a new key would exceed max size, remove the oldest (first) entry
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, value);
    return this;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }

  values(): IterableIterator<V> {
    return this.cache.values();
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.cache.entries();
  }
}

/**
 * Create a bounded map with default or custom size limit
 */
export function createBoundedMap<K, V>(maxSize?: number): BoundedMap<K, V> {
  return new BoundedMap<K, V>(maxSize);
} 