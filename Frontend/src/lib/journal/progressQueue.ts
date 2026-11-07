interface Entry<T> {
  pending: number;
  inFlight: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  first: T;
  confirmed: T;
  send: (delta: number) => Promise<T>;
}

export interface ProgressQueueOptions<T> {
  delayMs: number;
  /** All changes for this key reached the server. `confirmed` is the last saved state. */
  onSettled: (key: string, confirmed: T, before: T) => void;
  /** A save failed. `confirmed` is the last state the server accepted, to roll back to. */
  onFailed: (key: string, confirmed: T, error: unknown) => void;
  /** Nothing is waiting or being sent. */
  onIdle: () => void;
}

/**
 * Combines rapid progress taps into one request per title and keeps requests for a title in order.
 * Four quick taps send one request for +4, and +1 then -1 sends nothing.
 */
export class ProgressQueue<T> {
  private entries = new Map<string, Entry<T>>();
  private options: ProgressQueueOptions<T>;

  constructor(options: ProgressQueueOptions<T>) {
    this.options = options;
  }

  get busy(): boolean {
    return this.entries.size > 0;
  }

  enqueue(key: string, delta: number, current: T, send: (delta: number) => Promise<T>): void {
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { pending: 0, inFlight: false, timer: null, first: current, confirmed: current, send };
      this.entries.set(key, entry);
    }
    entry.pending += delta;
    this.schedule(key, entry);
  }

  /** Sends anything waiting right away, for when the page is being hidden. */
  flushAll(): void {
    for (const [key, entry] of this.entries) {
      if (entry.timer) clearTimeout(entry.timer);
      entry.timer = null;
      this.flush(key, entry);
    }
  }

  private schedule(key: string, entry: Entry<T>) {
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = setTimeout(() => {
      entry.timer = null;
      this.flush(key, entry);
    }, this.options.delayMs);
  }

  private flush(key: string, entry: Entry<T>) {
    if (entry.inFlight) return;
    if (entry.pending === 0) {
      this.finish(key, entry);
      return;
    }
    const delta = entry.pending;
    entry.pending = 0;
    entry.inFlight = true;
    entry.send(delta).then(
      (result) => {
        entry.confirmed = result;
        entry.inFlight = false;
        if (entry.timer) return;
        this.flush(key, entry);
      },
      (error) => {
        if (entry.timer) clearTimeout(entry.timer);
        this.entries.delete(key);
        this.options.onFailed(key, entry.confirmed, error);
        this.notifyIfIdle();
      }
    );
  }

  private finish(key: string, entry: Entry<T>) {
    this.entries.delete(key);
    this.options.onSettled(key, entry.confirmed, entry.first);
    this.notifyIfIdle();
  }

  private notifyIfIdle() {
    if (!this.busy) this.options.onIdle();
  }
}
