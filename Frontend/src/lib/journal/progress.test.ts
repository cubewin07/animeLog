import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { localToday, nextBookState, nextSeasonState, patchSeason } from './progress';
import { ProgressQueue } from './progressQueue';
import type { AnimeSeason, AnimeSeries, Book } from '../../types';

const season = (fields: Partial<AnimeSeason>) =>
  ({ id: 1, progress: 0, total_episodes: 12, status: 'WATCHING', finish_date: null, ...fields }) as AnimeSeason;

describe('nextSeasonState matches the server rules', () => {
  it('starts a planned season on the first episode', () => {
    expect(nextSeasonState(season({ status: 'PLAN_TO_WATCH' }), 1)?.status).toBe('WATCHING');
  });

  it('completes on the last episode and sets a finish date', () => {
    const next = nextSeasonState(season({ progress: 11 }), 1);
    expect(next?.status).toBe('COMPLETED');
    expect(next?.finish_date).toBeTruthy();
  });

  it('reopens when stepping back, and clears a finish date set today', () => {
    const finished = nextSeasonState(season({ progress: 11 }), 1) as AnimeSeason;
    const undone = nextSeasonState(finished, -1);
    expect(undone).toMatchObject({ status: 'WATCHING', progress: 11, finish_date: null });
  });

  it('keeps an older finish date when stepping back', () => {
    const next = nextSeasonState(season({ progress: 12, status: 'COMPLETED', finish_date: '2023-02-20' }), -1);
    expect(next).toMatchObject({ status: 'WATCHING', finish_date: '2023-02-20' });
  });

  it('refuses changes outside the valid range', () => {
    expect(nextSeasonState(season({ progress: 0 }), -1)).toBeNull();
    expect(nextSeasonState(season({ progress: 12 }), 1)).toBeNull();
  });

  it('allows any progress when the total is unknown', () => {
    expect(nextSeasonState(season({ progress: 500, total_episodes: null }), 1)?.progress).toBe(501);
  });
});

describe('localToday', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('formats YYYY-MM-DD with zero-padded local month and day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 8, 15, 0));
    expect(localToday()).toBe('2026-01-05');
  });

  it('uses local calendar components rather than UTC ISO date across day boundaries', () => {
    const RealDate = globalThis.Date;
    class MockBoundaryDate extends RealDate {
      constructor() {
        super('2026-11-12T23:30:00.000Z');
      }
      override getFullYear() {
        return 2026;
      }
      override getMonth() {
        return 10; // November
      }
      override getDate() {
        return 13;
      }
    }
    vi.stubGlobal('Date', MockBoundaryDate);
    expect(localToday()).toBe('2026-11-13');
  });
});

describe('nextBookState', () => {
  it('uses reading statuses and sets finish_date on completion', () => {
    const book = { id: 1, progress: 0, total_pages: 10, status: 'PLAN_TO_READ', finish_date: null } as Book;
    expect(nextBookState(book, 5)?.status).toBe('READING');
    const completed = nextBookState({ ...book, status: 'READING', progress: 9 }, 1);
    expect(completed?.status).toBe('COMPLETED');
    expect(completed?.finish_date).toBe(localToday());
  });

  it('clamps out-of-range page deltas and reopens completed books on negative delta', () => {
    const book = { id: 1, progress: 0, total_pages: 10, status: 'PLAN_TO_READ', finish_date: null } as Book;
    expect(nextBookState(book, -1)).toBeNull();
    expect(nextBookState({ ...book, progress: 10, status: 'COMPLETED' }, 1)).toBeNull();
    expect(nextBookState({ ...book, progress: 8, status: 'READING' }, 5)).toBeNull();

    const completedToday = { ...book, progress: 10, status: 'COMPLETED', finish_date: localToday() } as Book;
    expect(nextBookState(completedToday, -1)).toMatchObject({
      progress: 9,
      status: 'READING',
      finish_date: null,
    });

    const completedEarlier = { ...book, progress: 10, status: 'COMPLETED', finish_date: '2025-05-01' } as Book;
    expect(nextBookState(completedEarlier, -1)).toMatchObject({
      progress: 9,
      status: 'READING',
      finish_date: '2025-05-01',
    });

    expect(nextBookState({ ...book, progress: 300, total_pages: null, status: 'READING' }, 25)?.progress).toBe(325);
  });
});

describe('patchSeason', () => {
  it('leaves other series as the same objects so they do not re-render', () => {
    const list = [
      { id: 1, seasons: [season({ id: 1 })] },
      { id: 2, seasons: [season({ id: 2 })] },
    ] as AnimeSeries[];
    const patched = patchSeason(list, season({ id: 1, progress: 5 }));
    expect(patched[0].seasons[0].progress).toBe(5);
    expect(patched[1]).toBe(list[1]);
  });
});

describe('ProgressQueue', () => {
  const setup = () => {
    const onSettled = vi.fn();
    const onFailed = vi.fn();
    const onIdle = vi.fn();
    const queue = new ProgressQueue<number>({ delayMs: 100, onSettled, onFailed, onIdle });
    return { queue, onSettled, onFailed, onIdle };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('combines rapid taps into one request', async () => {
    const { queue, onSettled, onIdle } = setup();
    const send = vi.fn(async (delta: number) => 10 + delta);
    queue.enqueue('a', 1, 10, send);
    queue.enqueue('a', 1, 10, send);
    queue.enqueue('a', 1, 10, send);
    await vi.advanceTimersByTimeAsync(100);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(3);
    expect(onSettled).toHaveBeenCalledWith('a', 13, 10);
    expect(onIdle).toHaveBeenCalledOnce();
    expect(queue.busy).toBe(false);
  });

  it('sends nothing when taps cancel out', async () => {
    const { queue, onSettled } = setup();
    const send = vi.fn(async (delta: number) => delta);
    queue.enqueue('a', 1, 10, send);
    queue.enqueue('a', -1, 10, send);
    await vi.advanceTimersByTimeAsync(100);
    expect(send).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledWith('a', 10, 10);
  });

  it('keeps requests for one title in order', async () => {
    const { queue, onSettled } = setup();
    const resolvers: ((value: number) => void)[] = [];
    const send = vi.fn(() => new Promise<number>((resolve) => resolvers.push(resolve)));
    queue.enqueue('a', 1, 10, send);
    await vi.advanceTimersByTimeAsync(100);
    queue.enqueue('a', 2, 10, send);
    await vi.advanceTimersByTimeAsync(100);
    expect(send).toHaveBeenCalledTimes(1);
    resolvers[0](11);
    await vi.advanceTimersByTimeAsync(0);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith(2);
    expect(onSettled).not.toHaveBeenCalled();
    resolvers[1](13);
    await vi.advanceTimersByTimeAsync(0);
    expect(onSettled).toHaveBeenCalledWith('a', 13, 10);
  });

  it('rolls back to the last saved state on failure', async () => {
    const { queue, onFailed, onSettled, onIdle } = setup();
    const send = vi.fn(async () => {
      throw new Error('offline');
    });
    queue.enqueue('a', 1, 10, send);
    await vi.advanceTimersByTimeAsync(100);
    expect(onFailed).toHaveBeenCalledWith('a', 10, expect.any(Error));
    expect(onSettled).not.toHaveBeenCalled();
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it('keeps different titles separate', async () => {
    const { queue } = setup();
    const a = vi.fn(async () => 1);
    const b = vi.fn(async () => 2);
    queue.enqueue('a', 1, 0, a);
    queue.enqueue('b', 1, 0, b);
    await vi.advanceTimersByTimeAsync(100);
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });
});
