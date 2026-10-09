import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  addIssueToQueue,
  clearSyncedIssues,
  deleteIssueFromQueue,
  getPendingCount,
  getPendingIssues,
  markIssueAsSynced,
} from './indexedDB';

const sample = (title) => ({
  title,
  description: 'A pothole on the main road',
  location: { lat: 28.61, lng: 77.2 },
  priority: 'High',
  status: 'pending',
});

describe('offline issue queue (IndexedDB)', () => {
  beforeEach(() => {
    // Fresh database for every test; idb reads the global at call time.
    globalThis.indexedDB = new IDBFactory();
  });

  it('starts empty', async () => {
    expect(await getPendingIssues()).toEqual([]);
    expect(await getPendingCount()).toBe(0);
  });

  it('adds an issue with a generated id, timestamp and synced=false', async () => {
    const id = await addIssueToQueue(sample('One'));
    expect(typeof id).toBe('number');

    const [stored] = await getPendingIssues();
    expect(stored.id).toBe(id);
    expect(stored.title).toBe('One');
    expect(stored.synced).toBe(false);
    expect(() => new Date(stored.timestamp).toISOString()).not.toThrow();
  });

  it('counts only unsynced issues', async () => {
    const a = await addIssueToQueue(sample('A'));
    await addIssueToQueue(sample('B'));
    expect(await getPendingCount()).toBe(2);

    await markIssueAsSynced(a);
    expect(await getPendingCount()).toBe(1);
  });

  it('marks an issue as synced and ignores unknown ids', async () => {
    const id = await addIssueToQueue(sample('A'));
    await markIssueAsSynced(id);
    await markIssueAsSynced(9999);

    const all = await getPendingIssues();
    expect(all).toHaveLength(1);
    expect(all[0].synced).toBe(true);
  });

  it('clears only synced issues', async () => {
    const a = await addIssueToQueue(sample('A'));
    const b = await addIssueToQueue(sample('B'));
    await markIssueAsSynced(a);

    await clearSyncedIssues();

    const remaining = await getPendingIssues();
    expect(remaining.map((i) => i.id)).toEqual([b]);
  });

  it('deletes a single issue from the queue', async () => {
    const a = await addIssueToQueue(sample('A'));
    const b = await addIssueToQueue(sample('B'));

    await deleteIssueFromQueue(a);

    expect((await getPendingIssues()).map((i) => i.id)).toEqual([b]);
    expect(await getPendingCount()).toBe(1);
  });
});
