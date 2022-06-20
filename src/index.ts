import {
  Config,
  ConstructKey,
  Defer,
  Key,
  Result,
  ResultKeyed,
  TimeoutId,
} from './types';



export function bunch<T extends any[], R extends any>(
  fn: (args: T[]) => R | PromiseLike<R>,
  config: Config<T> & { includeMetadataInResponse: true; includeAllBatchArguments: true; },
): (...args: T) => Promise<Result<T, R>>;
export function bunch<T extends any[], R extends any>(
  fn: (...args: T) => R | PromiseLike<R>,
  config: Config<T> & { includeMetadataInResponse: true; includeAllBatchArguments?: false; },
): (...args: T) => Promise<Result<T, R>>;
export function bunch<T extends any[], R extends any>(
  fn: (args: T[]) => R | PromiseLike<R>,
  config: Config<T> & { includeMetadataInResponse?: false; includeAllBatchArguments: true; },
): (...args: T) => Promise<R>;
export function bunch<T extends any[], R extends any>(
  fn: (...args: T) => R | PromiseLike<R>,
  config: Config<T> & { includeMetadataInResponse?: false; includeAllBatchArguments?: false; },
): (...args: T) => Promise<R>;
export function bunch<T extends any[], R extends any>(
  fn: (args: T | T[]) => R | PromiseLike<R>,
  config: Config<T> & { includeMetadataInResponse?: boolean; includeAllBatchArguments?: boolean; },
): (...args: T) => Promise<R | Result<T, R>>;
export function bunch<T extends any[], R extends any>(
  fn: ((args: T[]) => R | PromiseLike<R>) | ((...args: T) => R | PromiseLike<R>),
  {
    debounce = 50,
    maxTimeout = Infinity,
    maxCount = Infinity,
    onNewBunch = () => {},
    onBunchExecute = () => {},
    includeAllBatchArguments,
    includeMetadataInResponse,
  }: Config<T> = {}
) {
  let timeout: TimeoutId | null;
  let firstInvocation: number | null;
  let invokeBy: number;
  let invocationCount = 0;
  let argBunch: T[] = [];
  let deferred: Defer<Result<T, R> | R>[] = [];

  reset();

  return (...args: T) => {
    argBunch.push(args);

    const promise = new Promise<Result<T, R> | R>((resolve, reject) => deferred.push({ resolve, reject }));

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
      const result = includeAllBatchArguments
        ? await fn(snapshot.argBunch)
        // @ts-ignore
        : await fn(...snapshot.argBunch[snapshot.argBunch.length - 1]);
 

      snapshot.argBunch.forEach((args, index) => {
        const defer = snapshot.deferred[index];
        defer.resolve(includeMetadataInResponse
          ? {
            result,
            index,
            arguments: args,
            bunch: {
              size: snapshot.invocationCount,
              arguments: snapshot.argBunch,
            },
          }
          : result
        );
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
  key: Key | ConstructKey<T>,
  fn: (args: T[]) => R | PromiseLike<R>,
  config?: Config<T> & { includeMetadataInResponse: true; includeAllBatchArguments: true; },
): (...args: T) => Promise<ResultKeyed<T, R>>;
export function keyed<T extends any[], R extends any>(
  key: Key | ConstructKey<T>,
  fn: (...args: T) => R | PromiseLike<R>,
  config?: Config<T> & { includeMetadataInResponse: true; includeAllBatchArguments?: false; },
): (...args: T) => Promise<ResultKeyed<T, R>>;
export function keyed<T extends any[], R extends any>(
  key: Key | ConstructKey<T>,
  fn: (args: T[]) => R | PromiseLike<R>,
  config?: Config<T> & { includeMetadataInResponse?: false; includeAllBatchArguments: true; },
): (...args: T) => Promise<R>;
export function keyed<T extends any[], R extends any>(
  key: Key | ConstructKey<T>,
  fn: (...args: T) => R | PromiseLike<R>,
  config?: Config<T> & { includeMetadataInResponse?: false; includeAllBatchArguments?: false; },
): (...args: T) => Promise<R>;
export function keyed<T extends any[], R extends any>(
  key: Key | ConstructKey<T>,
  fn: (args: T[] | T) => R | PromiseLike<R>,
  config: Config<T> = {}
) {
  const map: {
    [key in string]: (...args: T) => Promise<R | Result<T, R>>;
  } = {};

  if (!key) throw new Error(`bunchie keyed must be provided a key.`);

  return async (...args: T) => {
    const constructedKey = typeof key === 'function' ? key(...args) : key;
    const keyAsArray = Array.isArray(constructedKey) ? constructedKey : [constructedKey];
    if (!keyAsArray.length) throw new Error(`bunchie keyed cannot be provided an empty array as a key.`);

    const joined = keyAsArray.join(',');

    if (!map[joined]) {
      map[joined] = bunch(fn, {
        ...config,
        includeAllBatchArguments: config?.includeAllBatchArguments === true,
        includeMetadataInResponse: config?.includeMetadataInResponse === true,
        onBunchExecute: () => delete map[joined],
      })
    }

    const result = await map[joined](...args);
    return config?.includeMetadataInResponse
      ? {
        key: keyAsArray,
        ...result as Result<T, R>,
      }
      : result;
  };
}
