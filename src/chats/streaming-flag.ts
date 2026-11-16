const DEFAULT_FLIP_MS = 160;

/**
 * A request that fails instantly — a missing key, a rejected payload — should
 * not flash a "streaming" state. The flag only turns on once a run has outlived
 * a couple of frames, and a run that was superseded must not turn it off under
 * its successor: every run carries the token it began with.
 */
export type StreamingFlag = {
  /** Marks a new run and returns the token its completion must present. */
  begin(): number;
  /** Ends a run. A superseded run's completion is ignored. */
  end(token: number): void;
  /** Stops the run in flight and turns the flag off. */
  cancel(): void;
  dispose(): void;
  readonly streaming: boolean;
};

export function createStreamingFlag(
  onChange: (streaming: boolean) => void,
  flipMs = DEFAULT_FLIP_MS,
): StreamingFlag {
  let token = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let streaming = false;

  function clearTimer(): void {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
  }

  function set(next: boolean): void {
    if (streaming === next) return;
    streaming = next;
    onChange(next);
  }

  function begin(): number {
    clearTimer();
    token += 1;
    const current = token;
    timer = setTimeout(() => {
      timer = null;
      if (token === current) set(true);
    }, flipMs);
    return current;
  }

  function end(runToken: number): void {
    if (runToken !== token) return;
    clearTimer();
    set(false);
  }

  function cancel(): void {
    // Invalidate the run in flight before its completion lands.
    token += 1;
    clearTimer();
    set(false);
  }

  return {
    begin,
    end,
    cancel,
    dispose: cancel,
    get streaming() {
      return streaming;
    },
  };
}
