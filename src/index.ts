import {
  Config,
  ConstructKey,
  Defer,
  Key,
  Result,
  TimeoutId,
} from './types';

/**
 * 
 */
export function bunch<T extends any[], R extends any>(
  fn: (args: T[]) => R | PromiseLike<R>,
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
  let argBunch: T[] = [];
  let deferred: Defer<Result<T, R>>[] = [];

  reset();

  return (...args: T) => {
    argBunch.push(args);

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
      snapshot.argBunch.forEach((args, index) => {
        const defer = snapshot.deferred[index];
        defer.resolve({
          result,
          index,
          arguments: args,
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




export function keyed<T extends any[], R extends any>(
  fn: (args: T[]) => R | PromiseLike<R>,
  config: Config<T> = {}
) {
  const map: {
    [key in string]: (...args: T) => Promise<Result<T, R>>;
  } = {};

  return async (key: Key | ConstructKey<T>, ...args: T) => {
    if (!key) throw new Error(`bunchie keyed must be provided a key.`);
    const constructedKey = typeof key === 'function' ? key(...args) : key;
    const keyAsArray = Array.isArray(constructedKey) ? constructedKey : [constructedKey];
    if (!keyAsArray.length) throw new Error(`bunchie keyed cannot be provided an empty array as a key.`);

    const joined = keyAsArray.join(',');

    if (!map[joined]) {
      map[joined] = bunch(fn, {
        ...config,
        onBunchExecute: () => delete map[joined],
      })
    }

    const result = await map[joined](...args);
    return {
      key: keyAsArray,
      ...result,
    };
  };
}
