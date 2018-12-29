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
  let count;
  let deferred = [];

  reset();

  return (...args) => {
    firstInvocation = firstInvocation || Date.now();

    let index;
    if (args.length) index = argHistory.push(args) - 1;

    const promise = new Promise((resolve) => deferred.push({resolve, args, index}));

    // Handle case of maxCount.
    if (++count === maxCount) handle(args);
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
    count = 0;
    activeTimeout = clearTimeout(activeTimeout);
    firstInvocation = Date.now();
    invokeBy = firstInvocation + maxTimeout;
    deferred = [];
  }

  function handle(...args) {
    const handleArgs = argHistory;
    const toDefer = deferred;

    reset();

    onHandle && onHandle(...handleArgs);

    return Promise.resolve(handler(...handleArgs))
    .then(result => {
      toDefer.forEach(deferred => deferred.resolve({
        index: deferred.index,
        invokedWith: deferred.args,
        handledWith: handleArgs,
        result
      }));
    });
  }
}

module.exports.bunch = bunch;




const bunchedOnString = {};


/**
 *
 */
function bunchOnString(string, handler, config) {
  if (!bunchedOnString[string]) {
    config = config || {};

    const providedOnHandle = config.onHandle;
    // Override provided onHandle so that we can handle deleting the bunchie.
    // We then innvoke the provided onHandle if it was...provided.
    config.onHandle = (...handleArgs) => {
      delete bunchedOnString[string];
      if (providedOnHandle) providedOnHandle(...handleArgs);
    };

    bunchedOnString[string] = bunch((...args) => {
      return handler(string, ...args);
    }, config);
  }

  return bunchedOnString[string];
}

module.exports.bunchOnString = bunchOnString;
