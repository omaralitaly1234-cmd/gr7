// Unit tests for the Firestore read cache. It sits in front of every query the
// app makes, so its invalidation and error handling need to be pinned down.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  cached, buildKey, invalidatePath, clearReadCache, cacheStats, DEFAULT_TTL_MS,
} from '../src/lib/firebase/read-cache.js';

const MEMBERS = 'tenants/t1/members';
const SUBS = 'tenants/t1/subscriptions';

beforeEach(() => clearReadCache());

test('a repeated query is served from cache without re-running the loader', async () => {
  const key = buildKey(MEMBERS, [], null, 50);
  let calls = 0;
  const load = () => { calls += 1; return { data: [{ id: 'a' }], error: null }; };

  const first = await cached(key, load);
  const second = await cached(key, load);

  assert.equal(calls, 1);
  assert.deepEqual(second, first);
});

test('different query shapes do not share a cache entry', async () => {
  let calls = 0;
  const load = () => { calls += 1; return { data: [], error: null }; };

  await cached(buildKey(MEMBERS, [], null, 50), load);
  await cached(buildKey(MEMBERS, [], null, 25), load);                        // different limit
  await cached(buildKey(MEMBERS, [{ f: 'status' }], null, 50), load);         // different filter
  await cached(buildKey(SUBS, [], null, 50), load);                           // different collection
  await cached(MEMBERS && buildKey(MEMBERS, [], null, 50, 'count'), load);    // count vs docs

  assert.equal(calls, 5);
});

test('concurrent identical requests share one in-flight load', async () => {
  const key = buildKey(MEMBERS, [], null, 50);
  let calls = 0;
  const load = () => {
    calls += 1;
    return new Promise(resolve => setTimeout(() => resolve({ data: [], error: null }), 10));
  };

  const [a, b, c] = await Promise.all([cached(key, load), cached(key, load), cached(key, load)]);

  assert.equal(calls, 1);
  assert.deepEqual(a, b);
  assert.deepEqual(b, c);
  assert.equal(cacheStats().inflight, 0, 'in-flight entry must be released');
});

test('a failed read is never cached', async () => {
  const key = buildKey(MEMBERS, [], null, 50);
  let calls = 0;
  const failing = () => { calls += 1; return { data: [], error: 'missing index' }; };

  await cached(key, failing);
  await cached(key, failing);

  assert.equal(calls, 2, 'an error result must be retried, not replayed for the whole TTL');
});

test('writing to a collection drops only that collection', async () => {
  const memberKey = buildKey(MEMBERS, [], null, 50);
  const subKey = buildKey(SUBS, [], null, 50);
  let members = 0, subs = 0;

  await cached(memberKey, () => { members += 1; return { data: [], error: null }; });
  await cached(subKey, () => { subs += 1; return { data: [], error: null }; });

  invalidatePath(MEMBERS);

  await cached(memberKey, () => { members += 1; return { data: [], error: null }; });
  await cached(subKey, () => { subs += 1; return { data: [], error: null }; });

  assert.equal(members, 2, 'members was written to, so it must be re-read');
  assert.equal(subs, 1, 'subscriptions was untouched and stays cached');
});

test('invalidation matches the whole path segment, not a prefix', async () => {
  const key = buildKey('tenants/t1/members_archive', [], null, 50);
  let calls = 0;
  const load = () => { calls += 1; return { data: [], error: null }; };

  await cached(key, load);
  invalidatePath(MEMBERS);
  await cached(key, load);

  assert.equal(calls, 1, 'clearing members must not clear members_archive');
});

test('an entry past its TTL is re-read', async () => {
  const key = buildKey(MEMBERS, [], null, 50);
  let calls = 0;
  const load = () => { calls += 1; return { data: [], error: null }; };

  await cached(key, load, { ttl: 0 });
  await cached(key, load, { ttl: 0 });

  assert.equal(calls, 2);
});

test('the default TTL is short enough that another admin\'s write shows up quickly', () => {
  assert.ok(DEFAULT_TTL_MS <= 60_000, 'a stale window over a minute is too long for shared admin data');
});

test('cached entries are not corrupted when a caller mutates its result', async () => {
  // getDocuments hands out a copy for exactly this reason; this pins the
  // behaviour the copy protects.
  const key = buildKey(MEMBERS, [], null, 50);
  const load = () => ({ data: [{ id: 'b' }, { id: 'a' }], error: null });

  const first = await cached(key, load);
  const handedOut = { ...first, data: first.data.slice() };
  handedOut.data.sort((x, y) => x.id.localeCompare(y.id));

  const second = await cached(key, load);
  assert.deepEqual(second.data.map(d => d.id), ['b', 'a'], 'cached order must survive a caller sorting its copy');
});
