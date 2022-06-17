import {
  Config,
  Defer,
  Result,
  TimeoutId,
} from './types';

/**
 * 
 */
export function bunch<T extends any, R extends any>(
  fn: (args: (T | null)[]) => R | PromiseLike<R>,
  {
    debounce = 50,
    maxTimeout = Infinity,
    maxCount = Infinity,
    onNewBunch = () => {},
    onBunchExecute = () => {},
  }: Config<T> = {}
) {
  let timeout: TimeoutId | null;
  let firstInvocation: number | null;
  let invokeBy: number;
  let invocationCount = 0;
  let argBunch: (T | null)[] = [];
  let deferred: Defer<Result<T, R>>[] = [];

  reset();

  return (arg?: T) => {
    argBunch.push(arg || null);

    const promise = new Promise<Result<T, R>>((resolve, reject) => deferred.push({ resolve, reject }));

    if (!invocationCount) onNewBunch();

    if (++invocationCount >= maxCount) {
      execute();
      return promise;
    }

    let now = Date.now();

    if (!timeout) {
      firstInvocation = now;
      invokeBy = firstInvocation + maxTimeout;
    }

    timeout && clearTimeout(timeout);
    timeout = setTimeout(() => {
      execute();
    }, Math.min(debounce, Math.max(invokeBy - now, 0)));

    return promise;
  };

  function reset() {
    timeout && clearTimeout(timeout);
    timeout = null;
    firstInvocation = null;
    argBunch = [];
    deferred = [];
    invocationCount = 0;
  }

  async function execute() {
    const snapshot = {
      argBunch,
      deferred,
      invocationCount,
    };

    reset();

    onBunchExecute([...snapshot.argBunch]);

    try {
      const result = await fn(snapshot.argBunch);
      snapshot.argBunch.forEach((argument, index) => {
        const defer = snapshot.deferred[index];
        defer.resolve({
          result,
          index,
          argument,
          bunch: {
            size: snapshot.invocationCount,
            arguments: snapshot.argBunch,
          },
        });
      });
    }
    catch(err) {
      snapshot.argBunch.forEach((args, index) => {
        const defer = snapshot.deferred[index];
        defer.reject(err);
      });
    }
  }
}




export function keyed<T extends any, R extends any>(
  fn: (args: (T | null)[]) => R | PromiseLike<R>,
  config: Config<T> = {}
) {
  const map: {
    [key in string]: (arg?: T | undefined) => Promise<Result<T, R>>;
  } = {};

  return (key: string | string[], arg?: T) => {
    // console.log('KEYS', Object.keys(map).length);
    // console.log(Object.keys(map));
    if (!key) throw new Error(`bunchie keyed must be provided a key.`);
    key = Array.isArray(key) ? key : [key];
    if (!key.length) throw new Error(`bunchie keyed cannot be provided an empty array as a key.`);

    const joined = key.join(',');

    if (!map[joined]) {
      map[joined] = bunch(fn, {
        ...config,
        onBunchExecute: () => delete map[joined],
      })
    }

    return map[joined](arg);
  };
}
