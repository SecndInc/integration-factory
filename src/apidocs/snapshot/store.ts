// The durable record of one snapshot run: jobs/<site>/snapshots/<runId>/.
//
//   <endpoint_id>.ndjson   SnapshotRow lines, appended through an fs handle and fsynced per page
//   failures.ndjson        FailureRow lines, same
//   progress.json          the acknowledgement: acked page keys, rows, total, cursor, ids (atomic)
//   manifest.json          counts and status (atomic)
//
// The ack order is the contract: appendRows() returns after fsync, and only then does ack() put the page key into
// progress.json. A crash between the two leaves rows without an ack; resume refetches that page and the loader dedupes
// on (endpoint_id, page_key, record_index). No createWriteStream: recorder.ts stays the only stream writer.
// Design: docs/design/snapshot.md.

import { promises as fs } from 'node:fs';
import type { FileHandle } from 'node:fs/promises';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { writeAtomic } from '../atomic.js';
import { CaptureError } from '../errors.js';
import { sha256Hex } from './plan.js';
import { ManifestSchema, ProgressSchema, type EndpointState, type FailureRow, type Manifest, type Progress, type SnapshotPlan, type SnapshotRow } from './types.js';

const readChunkBytes = 1_048_576;

export interface AckPatch {
  /** NDJSON lines written for this page, added to the endpoint's `rows`. */
  addRows?: number;
  /** The endpoint's stated total so far (replaces). */
  total?: number;
  /** The cursor to request after this page; null when it was the last. */
  cursor?: string | null;
  /** This endpoint's totals contribution so far (replaces); a resume rereads it instead of recounting acked series. */
  totals?: { stated: number; matched: number };
  status?: EndpointState;
}

const failureText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export class SnapshotStore {
  readonly progress: Progress;
  private manifestState: Manifest;
  private readonly handles = new Map<string, FileHandle>();
  private readonly appendLocks = new Map<string, Promise<unknown>>();
  private readonly ackedSets = new Map<string, Set<string>>();
  private gen = 0;
  private written = 0;
  private flushLoop?: Promise<void>;

  private constructor(
    readonly dir: string,
    readonly site: string,
    readonly runId: string,
    progress: Progress,
    manifest: Manifest,
  ) {
    this.progress = progress;
    this.manifestState = manifest;
    for (const [id, e] of Object.entries(progress.endpoints)) this.ackedSets.set(id, new Set(e.acked));
  }

  static dirFor(jobsDir: string, site: string, runId: string): string {
    for (const [what, v] of [['site', site], ['run id', runId]] as const) {
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(v)) throw new CaptureError('workflow-invalid', `${what} "${v}" is not a safe directory name`);
    }
    return path.join(jobsDir, site, 'snapshots', runId);
  }

  /** A new run directory. Refuses one that already exists: a rerun without --resume is a new run id. */
  static async create(jobsDir: string, site: string, runId: string, plan: SnapshotPlan, now: () => Date = () => new Date()): Promise<SnapshotStore> {
    const dir = SnapshotStore.dirFor(jobsDir, site, runId);
    try {
      await fs.access(dir);
      throw new CaptureError('workflow-invalid', `${dir} already exists`, 'A new run needs a new run id; continue an existing one with --resume <runId>.');
    } catch (error) {
      if (error instanceof CaptureError) throw error;
    }
    await fs.mkdir(dir, { recursive: true });
    const progress: Progress = {
      progressVersion: 1,
      runId,
      endpoints: Object.fromEntries(plan.endpoints.map((e) => [e.id, { status: 'pending' as const, acked: [], rows: 0 }])),
      ids: {},
    };
    const manifest: Manifest = {
      manifestVersion: 1,
      runId,
      site,
      planSha256: sha256Hex(JSON.stringify(plan)),
      startedAt: now().toISOString(),
      status: 'running',
      counts: {
        endpointsPlanned: 0,
        complete: 0,
        partial: 0,
        failed: 0,
        skipped: 0,
        requests: 0,
        retries: 0,
        http429: 0,
        rows: 0,
        bytes: 0,
        totalsMatched: 0,
        totalsStated: 0,
        probeAliveAtEnd: false,
      },
      endpoints: {},
    };
    const store = new SnapshotStore(dir, site, runId, progress, manifest);
    await store.persistProgress();
    await store.writeManifest(manifest);
    return store;
  }

  /** Reopen a run directory. Refuses a missing, foreign or already complete run. */
  static async resume(jobsDir: string, site: string, runId: string): Promise<SnapshotStore> {
    const dir = SnapshotStore.dirFor(jobsDir, site, runId);
    const read = async <T>(name: string, parse: (json: unknown) => { success: boolean; data?: T; error?: { message: string } }): Promise<T> => {
      let text: string;
      try {
        text = await fs.readFile(path.join(dir, name), 'utf8');
      } catch {
        throw new CaptureError('workflow-invalid', `no run ${runId} for ${site}: cannot read ${path.join(dir, name)}`, 'List jobs/<site>/snapshots/ for run ids.');
      }
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch (error) {
        throw new CaptureError('workflow-invalid', `${path.join(dir, name)} is not valid JSON: ${failureText(error)}`);
      }
      const parsed = parse(json);
      if (!parsed.success) throw new CaptureError('workflow-invalid', `${path.join(dir, name)} is not a snapshot ${name}: ${parsed.error?.message ?? 'schema mismatch'}`);
      return parsed.data as T;
    };
    const manifest = await read<Manifest>('manifest.json', (j) => ManifestSchema.safeParse(j));
    const progress = await read<Progress>('progress.json', (j) => ProgressSchema.safeParse(j));
    if (manifest.site !== site || manifest.runId !== runId || progress.runId !== runId) {
      throw new CaptureError('workflow-invalid', `${dir} belongs to ${manifest.site}/${manifest.runId}, not ${site}/${runId}`);
    }
    if (manifest.status === 'complete') {
      throw new CaptureError('workflow-invalid', `run ${runId} is already complete`, 'Start a new run without --resume.');
    }
    return new SnapshotStore(dir, site, runId, progress, manifest);
  }

  get manifest(): Manifest {
    return this.manifestState;
  }

  // ---- acknowledgement

  isAcked(endpointId: string, pageKey: string): boolean {
    return this.ackedSets.get(endpointId)?.has(pageKey) ?? false;
  }

  ackedCount(endpointId: string): number {
    return this.ackedSets.get(endpointId)?.size ?? 0;
  }

  stateOf(endpointId: string): EndpointState {
    return this.progress.endpoints[endpointId]?.status ?? 'pending';
  }

  cursorOf(endpointId: string): string | null | undefined {
    return this.progress.endpoints[endpointId]?.cursor;
  }

  /**
   * Append the page's rows (one envelope line, then one per record) and fsync. Returns the bytes written.
   * Call `ack` only after this resolves.
   */
  async appendRows(endpointId: string, rows: readonly SnapshotRow[]): Promise<number> {
    if (rows.length === 0) return 0;
    return await this.append(`${endpointId}.ndjson`, rows);
  }

  async appendFailure(row: FailureRow): Promise<void> {
    await this.append('failures.ndjson', [row]);
  }

  /** Record the page as done: its key joins `acked`, the patch applies, and progress.json is rewritten atomically. */
  async ack(endpointId: string, pageKey: string, patch: AckPatch = {}): Promise<void> {
    const e = this.endpoint(endpointId);
    let set = this.ackedSets.get(endpointId);
    if (!set) this.ackedSets.set(endpointId, (set = new Set(e.acked)));
    if (!set.has(pageKey)) {
      set.add(pageKey);
      e.acked.push(pageKey);
    }
    this.applyPatch(e, patch);
    await this.persistProgress();
  }

  /** Change an endpoint's state (and total) without a page. */
  async setState(endpointId: string, status: EndpointState, patch: Omit<AckPatch, 'status'> = {}): Promise<void> {
    this.applyPatch(this.endpoint(endpointId), { ...patch, status });
    await this.persistProgress();
  }

  /** Ids a parent yielded, persisted so a resume does not refetch the parent. New values join in first-seen order. */
  async recordIds(name: string, ids: readonly string[]): Promise<void> {
    const have = this.progress.ids[name] ?? (this.progress.ids[name] = []);
    const seen = new Set(have);
    let added = false;
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        have.push(id);
        added = true;
      }
    }
    if (added) await this.persistProgress();
  }

  idsOf(name: string): string[] {
    return this.progress.ids[name] ?? [];
  }

  async writeManifest(manifest: Manifest): Promise<void> {
    this.manifestState = manifest;
    await writeAtomic(path.join(this.dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  }

  /** The last write of a run: same as `writeManifest`, named for what it means. */
  async finish(manifest: Manifest): Promise<void> {
    await this.writeManifest(manifest);
  }

  async close(): Promise<void> {
    await this.flushLoop?.catch(() => undefined);
    const open = [...this.handles.values()];
    this.handles.clear();
    await Promise.all(open.map((h) => h.close().catch(() => undefined)));
  }

  // ---- reading back what was written

  /** The payload of the first envelope line of an endpoint (or of the page `pageKey`), or undefined. */
  async readEnvelope(endpointId: string, pageKey?: string): Promise<string | undefined> {
    let found: string | undefined;
    await this.scan(`${endpointId}.ndjson`, (line) => {
      if (!line.includes('"record_index":-1,')) return false;
      const row = JSON.parse(line) as { page_key: string; record_index: number; payload: string };
      if (row.record_index !== -1 || (pageKey !== undefined && row.page_key !== pageKey)) return false;
      found = row.payload;
      return true;
    });
    return found;
  }

  /** Distinct (page_key, record_index) record lines of an endpoint whose page key passes `include`. Duplicate pages count once. */
  async countRecords(endpointId: string, include: (pageKey: string) => boolean): Promise<number> {
    const seen = new Set<string>();
    const head = /"page_key":("(?:[^"\\]|\\.)*"),"record_index":(-?\d+),/;
    await this.scan(`${endpointId}.ndjson`, (line) => {
      const m = head.exec(line);
      if (!m || Number(m[2]) < 0) return false;
      const key = JSON.parse(m[1]!) as string;
      if (include(key)) seen.add(`${key}#${m[2]}`);
      return false;
    });
    return seen.size;
  }

  // ---- internals

  private endpoint(endpointId: string): Progress['endpoints'][string] {
    return (this.progress.endpoints[endpointId] ??= { status: 'pending', acked: [], rows: 0 });
  }

  private applyPatch(e: Progress['endpoints'][string], patch: AckPatch): void {
    if (patch.addRows) e.rows += patch.addRows;
    if (patch.total !== undefined) e.total = patch.total;
    if (patch.cursor !== undefined) e.cursor = patch.cursor;
    if (patch.totals) e.totals = patch.totals;
    if (patch.status) e.status = patch.status;
  }

  private async handle(name: string): Promise<FileHandle> {
    let h = this.handles.get(name);
    if (!h) {
      h = await fs.open(path.join(this.dir, name), 'a');
      this.handles.set(name, h);
    }
    return h;
  }

  /** Appends to one file never interleave: the lines of a page are written and synced under that file's lock. */
  private async append(name: string, rows: readonly object[]): Promise<number> {
    const data = `${rows.map((r) => JSON.stringify(r)).join('\n')}\n`;
    const prior = this.appendLocks.get(name) ?? Promise.resolve();
    const run = prior.catch(() => undefined).then(async () => {
      const h = await this.handle(name);
      await h.appendFile(data, 'utf8');
      await h.sync();
    });
    this.appendLocks.set(name, run);
    await run;
    return Buffer.byteLength(data, 'utf8');
  }

  /** Rewrites progress.json; concurrent callers share a write, and each resolves only after a write that includes its change. */
  private async persistProgress(): Promise<void> {
    this.gen += 1;
    this.flushLoop ??= this.runFlush();
    await this.flushLoop;
  }

  private async runFlush(): Promise<void> {
    try {
      while (this.written < this.gen) {
        const target = this.gen;
        await writeAtomic(path.join(this.dir, 'progress.json'), `${JSON.stringify(this.progress)}\n`);
        this.written = target;
      }
    } finally {
      this.flushLoop = undefined;
    }
  }

  /** Feed each line of a file to `visit`; a true return stops the scan. A missing file is an empty one. */
  private async scan(name: string, visit: (line: string) => boolean): Promise<void> {
    let h: FileHandle;
    try {
      h = await fs.open(path.join(this.dir, name), 'r');
    } catch {
      return;
    }
    try {
      const decoder = new StringDecoder('utf8');
      const buf = Buffer.alloc(readChunkBytes);
      let tail = '';
      for (;;) {
        const { bytesRead } = await h.read(buf, 0, buf.length, null);
        if (bytesRead === 0) break;
        const parts = (tail + decoder.write(buf.subarray(0, bytesRead))).split('\n');
        tail = parts.pop() ?? '';
        for (const line of parts) if (line !== '' && visit(line)) return;
      }
      tail += decoder.end();
      if (tail !== '') visit(tail);
    } finally {
      await h.close();
    }
  }
}
