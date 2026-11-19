// The timer that stands still for several reasons and resumes with the time left (specs/overlay.md, T1 to T4).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPausableTimer } from '../src/lib/internal/timer/pausableTimer';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

type Reason = 'hover' | 'focus' | 'hidden';

function make(duration = 3000) {
  const elapsed = vi.fn();
  const timer = createPausableTimer<Reason>(duration, elapsed);
  return { timer, elapsed };
}

describe('running (T1)', () => {
  it('calls onElapsed once, when the duration is up and not before', () => {
    const { timer, elapsed } = make(3000);
    timer.start();
    vi.advanceTimersByTime(2999);
    expect(elapsed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(elapsed).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60000);
    expect(elapsed).toHaveBeenCalledTimes(1);
  });

  it('does nothing before start', () => {
    const { elapsed } = make(1000);
    vi.advanceTimersByTime(5000);
    expect(elapsed).not.toHaveBeenCalled();
  });

  it('a duration of 0 never fires, and restart to 0 stops it', () => {
    const zero = make(0);
    zero.timer.start();
    vi.advanceTimersByTime(60000);
    expect(zero.elapsed).not.toHaveBeenCalled();

    const { timer, elapsed } = make(1000);
    timer.start();
    timer.restart(0);
    vi.advanceTimersByTime(60000);
    expect(elapsed).not.toHaveBeenCalled();
  });

  it('reports the time left: it counts down while it runs', () => {
    const { timer } = make(3000);
    expect(timer.remaining).toBe(3000);
    timer.start();
    vi.advanceTimersByTime(1000);
    expect(timer.remaining).toBe(2000);
    vi.advanceTimersByTime(2000);
    expect(timer.remaining).toBe(0);
  });
});

describe('pausing (T2)', () => {
  it('a pause keeps the time left, and the timer resumes with it (it does not start again)', () => {
    const { timer, elapsed } = make(3000);
    timer.start();
    vi.advanceTimersByTime(1000);
    timer.setPaused('hover', true);
    expect(timer.paused).toBe(true);
    vi.advanceTimersByTime(60000);
    expect(elapsed).not.toHaveBeenCalled();
    expect(timer.remaining).toBe(2000);
    timer.setPaused('hover', false);
    expect(timer.paused).toBe(false);
    vi.advanceTimersByTime(1999);
    expect(elapsed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(elapsed).toHaveBeenCalledTimes(1);
  });

  it('pauses again and again lose nothing of what is left (the fault React 2.1.1 fixed)', () => {
    const { timer, elapsed } = make(3000);
    timer.start();
    for (let round = 0; round < 3; round += 1) {
      vi.advanceTimersByTime(500);
      timer.setPaused('hover', true);
      vi.advanceTimersByTime(10000);
      timer.setPaused('hover', false);
    }
    expect(timer.remaining).toBe(1500);
    vi.advanceTimersByTime(1499);
    expect(elapsed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(elapsed).toHaveBeenCalledTimes(1);
  });

  it('a pause with no time passed keeps the whole duration', () => {
    const { timer, elapsed } = make(3000);
    timer.start();
    timer.setPaused('focus', true);
    timer.setPaused('focus', false);
    vi.advanceTimersByTime(2999);
    expect(elapsed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(elapsed).toHaveBeenCalledTimes(1);
  });

  it('the timer stands still until every reason has let go', () => {
    const { timer, elapsed } = make(2000);
    timer.start();
    timer.setPaused('hover', true);
    timer.setPaused('focus', true);
    timer.setPaused('hover', false);
    vi.advanceTimersByTime(60000);
    expect(elapsed).not.toHaveBeenCalled();
    expect(timer.paused).toBe(true);
    timer.setPaused('focus', false);
    vi.advanceTimersByTime(2000);
    expect(elapsed).toHaveBeenCalledTimes(1);
  });

  it('the same reason set twice is one reason; letting go of a reason that does not hold changes nothing', () => {
    const { timer, elapsed } = make(2000);
    timer.start();
    timer.setPaused('hover', false);
    timer.setPaused('hover', true);
    timer.setPaused('hover', true);
    timer.setPaused('hover', false);
    expect(timer.paused).toBe(false);
    vi.advanceTimersByTime(2000);
    expect(elapsed).toHaveBeenCalledTimes(1);
  });

  it('a timer held before start waits for the reasons to let go, and then runs the whole duration', () => {
    const { timer, elapsed } = make(2000);
    timer.setPaused('hidden', true);
    timer.start();
    vi.advanceTimersByTime(60000);
    expect(elapsed).not.toHaveBeenCalled();
    timer.setPaused('hidden', false);
    vi.advanceTimersByTime(1999);
    expect(elapsed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(elapsed).toHaveBeenCalledTimes(1);
  });

  it('a timer with no duration is not started by letting a reason go', () => {
    const { timer, elapsed } = make(0);
    timer.setPaused('hover', true);
    timer.setPaused('hover', false);
    vi.advanceTimersByTime(60000);
    expect(elapsed).not.toHaveBeenCalled();
  });
});

describe('restarting (T3)', () => {
  it('counts the new duration in full, from now', () => {
    const { timer, elapsed } = make(3000);
    timer.start();
    vi.advanceTimersByTime(2000);
    timer.restart(5000);
    vi.advanceTimersByTime(4999);
    expect(elapsed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(elapsed).toHaveBeenCalledTimes(1);
  });

  it('the reasons that hold stay: a held timer is restarted but does not run until they let go', () => {
    const { timer, elapsed } = make(3000);
    timer.start();
    vi.advanceTimersByTime(2000);
    timer.setPaused('hover', true);
    timer.restart(4000);
    vi.advanceTimersByTime(60000);
    expect(elapsed).not.toHaveBeenCalled();
    expect(timer.remaining).toBe(4000);
    timer.setPaused('hover', false);
    vi.advanceTimersByTime(4000);
    expect(elapsed).toHaveBeenCalledTimes(1);
  });
});

describe('ending (T4)', () => {
  it('cancel stops it for good: no call, and neither restart nor a resumed pause starts it again', () => {
    const { timer, elapsed } = make(3000);
    timer.start();
    timer.setPaused('hover', true);
    timer.cancel();
    timer.setPaused('hover', false);
    timer.restart(1000);
    timer.start();
    vi.advanceTimersByTime(60000);
    expect(elapsed).not.toHaveBeenCalled();
  });

  it('cancel while it runs clears the pending call, and may be repeated', () => {
    const { timer, elapsed } = make(3000);
    timer.start();
    vi.advanceTimersByTime(1000);
    timer.cancel();
    timer.cancel();
    vi.advanceTimersByTime(60000);
    expect(elapsed).not.toHaveBeenCalled();
  });

  it('once it has fired it is finished: a pause and a resume do not fire it again', () => {
    const { timer, elapsed } = make(1000);
    timer.start();
    vi.advanceTimersByTime(1000);
    expect(elapsed).toHaveBeenCalledTimes(1);
    timer.setPaused('hover', true);
    timer.setPaused('hover', false);
    timer.restart(1000);
    vi.advanceTimersByTime(60000);
    expect(elapsed).toHaveBeenCalledTimes(1);
    expect(timer.remaining).toBe(0);
  });
});
