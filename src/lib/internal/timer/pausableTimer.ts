/**
 * A timer that stands still for as many reasons as there are, and resumes with the time that was left (specs/overlay.md, T1
 * to T4). A notice that closes by itself uses it: the pointer is over it, focus is in it, a pile that holds it is open, the
 * page is hidden. Each of those is a reason; the timer runs when none of them holds.
 *
 * It keeps no state for a framework: the owner calls `setPaused` and reads `remaining`. A closure and not a class, because
 * private class fields are not known to the oldest engines the library supports (Firefox 85).
 */
export interface PausableTimer<Reason extends string = string> {
  /** Starts counting down (unless a reason holds, or the duration is 0). Calling it again starts the count again from the time left. */
  start(): void;
  /** Gives the timer a new duration, counts it in full, and runs (unless a reason holds). The reasons that hold stay. A finished timer is not restarted. */
  restart(duration: number): void;
  /** Holds the timer for a reason, or lets that reason go. The time that was left is kept while it stands. */
  setPaused(reason: Reason, on: boolean): void;
  /** Stops for good: nothing fires after it, and `restart` and `setPaused` do not start it again. */
  cancel(): void;
  /** Milliseconds left. It counts down while the timer runs and stands still while a reason holds it. */
  readonly remaining: number;
  /** A reason holds the timer. */
  readonly paused: boolean;
}

/**
 * `duration` is in milliseconds; 0 never fires. `onElapsed` is called once, when the time is up; the timer is finished after
 * that, so a later pause and resume does not fire it again.
 */
export function createPausableTimer<Reason extends string = string>(duration: number, onElapsed: () => void): PausableTimer<Reason> {
  let total = duration;
  let left = duration;
  let startedAt = 0;
  let handle: ReturnType<typeof setTimeout> | undefined;
  let finished = false;
  const reasons = new Set<Reason>();

  function stop(): void {
    if (handle !== undefined) clearTimeout(handle);
    handle = undefined;
  }

  function arm(): void {
    stop();
    if (total === 0 || reasons.size > 0 || finished) return;
    startedAt = Date.now();
    handle = setTimeout(() => {
      handle = undefined;
      left = 0;
      finished = true;
      onElapsed();
    }, left);
  }

  return {
    start: arm,
    restart(next) {
      if (finished) return;
      total = next;
      left = next;
      arm();
    },
    setPaused(reason, on) {
      const was = reasons.size > 0;
      if (on) reasons.add(reason);
      else reasons.delete(reason);
      const now = reasons.size > 0;
      if (!was && now && handle !== undefined) {
        // Remember how much of the time is left: the timer resumes with it, it does not start again.
        left = Math.max(0, left - (Date.now() - startedAt));
        stop();
      } else if (was && !now) {
        arm();
      }
    },
    cancel() {
      finished = true;
      stop();
    },
    get remaining() {
      return handle !== undefined ? Math.max(0, left - (Date.now() - startedAt)) : left;
    },
    get paused() {
      return reasons.size > 0;
    }
  };
}
