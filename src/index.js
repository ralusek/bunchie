'use strict';


/**
 *
 */
function bunch(handler, {
  debounce = 1000,
  maxTimeout = Infinity,
  maxCount = Infinity,
  onHandle
} = {}) {
  let argHistory;
  let firstInvocation;
  let invokeBy;
  let activeTimeout;
  let deferred = [];

  reset();

  return (...args) => {
    firstInvocation = firstInvocation || Date.now();

    const index = argHistory.push(args) - 1;

    const promise = new Promise((resolve, reject) => deferred.push({resolve, reject, args, index}));

    // Handle case of maxCount.
    if ((index + 1) === maxCount) handle(args);
    else {
      // Handle debounce.
      clearTimeout(activeTimeout);
      const timeUntilMaxTimeout = invokeBy - Date.now();
      const deadline = timeUntilMaxTimeout < debounce ? timeUntilMaxTimeout : debounce;
      activeTimeout = setTimeout(() => handle(...args), deadline);
    }

    return promise;
  }

  function reset() {
    argHistory = [];
    activeTimeout = clearTimeout(activeTimeout);
    firstInvocation = Date.now();
    invokeBy = firstInvocation + maxTimeout;
    deferred = [];
  }

  function handle(...args) {
    const handleArgs = argHistory;
    const toDefer = deferred;
    const batchStartedAt = firstInvocation;
    const batchTimeTaken = Date.now() - batchStartedAt;

    reset();

    onHandle && onHandle(...handleArgs);

    const batchMeta = {
      handledWith: handleArgs,
      batchStartedAt,
      batchTimeTaken,
    };

    return Promise.resolve(handler(...handleArgs))
    .then(
      result => {
        toDefer.forEach(deferred => deferred.resolve({
          ...batchMeta,
          index: deferred.index,
          invokedWith: deferred.args,
          result,
        }));
      },
      err => {
        toDefer.forEach(deferred => {
          err.bunchieMeta = {
            // We omit deferred-specific information, as this error object
            // is shared between all deferred responses, therefore only the
            // handleArgs are added as meta.
            // index: deferred.index,
            // invokedWith: deferred.args,
            ...batchMeta,
          };

          deferred.reject(err);
        });
      }
    );
  }
}

module.exports.bunch = bunch;




const bunchedOnKey = {};


/**
 *
 */
function bunchOnKey(key, handler, config) {
  if (!bunchedOnKey[key]) {
    config = config || {};

    const providedOnHandle = config.onHandle;
    // Override provided onHandle so that we can handle deleting the bunchie.
    // We then innvoke the provided onHandle if it was...provided.
    config.onHandle = (...handleArgs) => {
      delete bunchedOnKey[key];
      if (providedOnHandle) providedOnHandle(...handleArgs);
    };

    bunchedOnKey[key] = bunch((...args) => {
      return handler(key, ...args);
    }, config);
  }

  return (...args) => {
    return bunchedOnKey[key](...args)
    .then(response => ({...response, key}));
  };
}

module.exports.bunchOnKey = bunchOnKey;
