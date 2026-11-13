import { afterEach, describe, expect, it, vi } from 'vitest';
import { activityApi, bookApi } from './client';
import type { ActivityEvent, Book } from '../types';

function makeJsonResponse(body: unknown, headers: Record<string, string> = {}, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('bookApi.updateProgress sends PATCH /api/books/{id}/progress/ with delta payload', async () => {
    const updatedBook = { id: 42, title: 'Dune', progress: 120 } as Book;
    const fetchMock = vi.fn(async () => makeJsonResponse(updatedBook));
    vi.stubGlobal('fetch', fetchMock);

    const result = await bookApi.updateProgress(42, 15);

    expect(result).toEqual(updatedBook);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/books/42/progress/');
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe(JSON.stringify({ delta: 15 }));
  });

  it('activityApi.list paginates with offset while X-Has-More is true', async () => {
    const page1 = [
      { id: 1, kind: 'EPISODE_PROGRESS', target_type: 'season', target_id: 1, title: 'A', delta: 1, backfilled: false, created_at: '2026-11-12T10:00:00Z' },
      { id: 2, kind: 'EPISODE_PROGRESS', target_type: 'season', target_id: 1, title: 'A', delta: 1, backfilled: false, created_at: '2026-11-12T09:00:00Z' },
    ] as ActivityEvent[];
    const page2 = [
      { id: 3, kind: 'NOTE_WRITTEN', target_type: 'book', target_id: 2, title: 'B', delta: 1, backfilled: false, created_at: '2026-11-11T08:00:00Z' },
    ] as ActivityEvent[];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(page1, { 'X-Has-More': 'true', 'X-Total-Count': '3' }))
      .mockResolvedValueOnce(makeJsonResponse(page2, { 'X-Has-More': 'false', 'X-Total-Count': '3' }));
    vi.stubGlobal('fetch', fetchMock);

    const events = await activityApi.list({ since: '2026-11-01' });

    expect(events.map((e) => e.id)).toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe(
      '/api/activity/?since=2026-11-01&limit=1000&offset=0',
    );
    expect((fetchMock.mock.calls[1] as unknown as [string])[0]).toBe(
      '/api/activity/?since=2026-11-01&limit=1000&offset=2',
    );
  });

  it('activityApi.list stops if X-Has-More is true but page is empty, and respects explicit limit/offset', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse([], { 'X-Has-More': 'true' }))
      .mockResolvedValueOnce(makeJsonResponse([{ id: 9 }]));
    vi.stubGlobal('fetch', fetchMock);

    const empty = await activityApi.list();
    expect(empty).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const singlePage = await activityApi.list({ limit: 50, offset: 10 });
    expect(singlePage).toEqual([{ id: 9 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[1] as unknown as [string])[0]).toBe('/api/activity/?limit=50&offset=10');
  });
});
