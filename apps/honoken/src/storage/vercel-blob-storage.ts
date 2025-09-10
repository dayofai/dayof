import { Buffer } from 'node:buffer';
import type { PutCommandOptions } from '@vercel/blob';
import { BlobAccessError, del, head, put } from '@vercel/blob';
import type { Env } from '../types';
import type { Logger } from '../utils/logger';

// Precompiled regex patterns (top-level)
const TRAILING_SLASHES = /\/+$/;
const LEADING_SLASHES = /^\/+/;

// Narrowed error shape for SDK errors
type BlobErrorLike = {
  name?: string;
  status?: number;
  statusCode?: number;
  code?: number;
};

// Minimal shape returned by put() that we consume
type BlobPutResult = {
  url: string;
  downloadUrl?: string;
};

export class VercelBlobAssetStorage {
  private prefix?: string;
  private token: string;
  private logger: Logger;

  constructor(env: Env, logger: Logger, opts?: { prefix?: string }) {
    this.logger = logger;
    this.token = env.BLOB_READ_WRITE_TOKEN;
    if (!this.token) {
      logger.error(
        'BLOB_READ_WRITE_TOKEN missing in env',
        new Error('BlobConfigError')
      );
      throw new Error(
        'BLOB_READ_WRITE_TOKEN is required for Vercel Blob operations'
      );
    }
    this.prefix = opts?.prefix;
  }

  private withPrefix(key: string) {
    return this.prefix
      ? `${this.prefix.replace(TRAILING_SLASHES, '')}/${key.replace(LEADING_SLASHES, '')}`
      : key.replace(LEADING_SLASHES, '');
  }

  private async getFetchUrl(path: string): Promise<string | null> {
    try {
      const meta = await head(path, { token: this.token });
      const anyMeta = meta as Partial<{ downloadUrl: string; url: string }>;
      return anyMeta.downloadUrl ?? anyMeta.url ?? null;
    } catch (err) {
      const e = err as BlobErrorLike;
      const name = e.name;
      const status = e.status ?? e.statusCode ?? e.code;
      if (
        (err instanceof BlobAccessError || name === 'BlobNotFoundError') &&
        (name === 'BlobNotFoundError' || status === 404)
      ) {
        return null;
      }
      this.logger.error(
        'Failed to resolve blob URL via HEAD',
        err instanceof Error ? err : new Error(String(err)),
        { key: path }
      );
      throw err;
    }
  }

  async store(
    key: string,
    data: ArrayBuffer,
    ttlSeconds = 3600,
    contentType = 'image/png',
    opts?: {
      addRandomSuffix?: boolean;
      allowOverwrite?: boolean;
      abortSignal?: AbortSignal;
    }
  ): Promise<string> {
    const path = this.withPrefix(key);
    const body = Buffer.from(data);

    const ttl = Math.max(60, ttlSeconds);

    const putOpts: PutCommandOptions = {
      addRandomSuffix: opts?.addRandomSuffix ?? false,
      allowOverwrite: opts?.allowOverwrite ?? true,
      contentType,
      cacheControlMaxAge: ttl,
      token: this.token,
      access: 'public',
      abortSignal: opts?.abortSignal,
    };

    const res = (await put(path, body, putOpts)) as BlobPutResult;

    this.logger.info('Asset stored in Vercel Blob', {
      key: path,
      url: res.url,
      size: body.byteLength,
      contentType,
      cacheControlMaxAge: ttl,
      addRandomSuffix: putOpts.addRandomSuffix,
      allowOverwrite: putOpts.allowOverwrite,
    });

    return res.downloadUrl ?? res.url;
  }

  async retrieve(
    key: string,
    opts?: { signal?: AbortSignal }
  ): Promise<ArrayBuffer | null> {
    const path = this.withPrefix(key);
    const url = await this.getFetchUrl(path);
    if (!url) {
      this.logger.info('Asset not found in Vercel Blob', { key: path });
      return null;
    }
    const resp = await fetch(url, { signal: opts?.signal });
    if (!resp.ok) {
      this.logger.warn('Blob fetch failed', { key: path, status: resp.status });
      return null;
    }
    const buf = await resp.arrayBuffer();
    this.logger.info('Asset retrieved from Vercel Blob', {
      key: path,
      size: buf.byteLength,
    });
    return buf;
  }

  async retrieveRange(
    key: string,
    start: number,
    endInclusive: number
  ): Promise<ArrayBuffer | null> {
    const path = this.withPrefix(key);
    const url = await this.getFetchUrl(path);
    if (!url) {
      this.logger.info('Asset not found (range) in Vercel Blob', { key: path });
      return null;
    }
    const resp = await fetch(url, {
      headers: { Range: `bytes=${start}-${endInclusive}` },
    });
    if (!(resp.status === 206 || resp.status === 200)) {
      this.logger.warn('Range fetch failed', {
        key: path,
        status: resp.status,
      });
      return null;
    }
    const buf = await resp.arrayBuffer();
    this.logger.info('Asset range retrieved from Vercel Blob', {
      key: path,
      range: `${start}-${endInclusive}`,
      size: buf.byteLength,
      status: resp.status,
    });
    return buf;
  }

  async delete(key: string): Promise<void> {
    const path = this.withPrefix(key);
    try {
      await del(path, { token: this.token });
      this.logger.info('Asset deleted from Vercel Blob', { key: path });
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      this.logger.error('Failed to delete asset from Vercel Blob', errorObj, {
        key: path,
      });
      throw errorObj;
    }
  }

  async exists(key: string): Promise<boolean> {
    const path = this.withPrefix(key);
    try {
      await head(path, { token: this.token });
      return true;
    } catch (err) {
      const e = err as BlobErrorLike;
      const name = e.name;
      const status = e.status ?? e.statusCode ?? e.code;
      if (
        (err instanceof BlobAccessError || name === 'BlobNotFoundError') &&
        (name === 'BlobNotFoundError' || status === 404)
      ) {
        return false;
      }
      const errorObj = err instanceof Error ? err : new Error(String(err));
      this.logger.error(
        'Failed to check asset existence in Vercel Blob',
        errorObj,
        {
          key: path,
        }
      );
      return false;
    }
  }
}
