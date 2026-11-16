type SerialQueue = <T>(task: () => Promise<T>) => Promise<T>;

/**
 * One promise chain for every read and write of a store. A task starts only
 * after the previous one settled, and the chain stores the swallowed promise so
 * a rejection cannot poison it — the caller still gets the rejecting promise.
 */
export function createSerialQueue(onError?: (error: unknown) => void): SerialQueue {
  let tail: Promise<unknown> = Promise.resolve();

  return <T>(task: () => Promise<T>): Promise<T> => {
    const run = tail.then(task);
    tail = run.catch((error) => {
      onError?.(error);
    });
    return run;
  };
}
