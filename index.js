'use strict';


// This establishes a private namespace.
const namespace = new WeakMap();
function p(object) {
  if (!namespace.has(object)) namespace.set(object, {});
  return namespace.get(object);
}



/**
 *
 */
class Bunchie {
  /**
   *
   */
  constructor(config = {}) {

    if (config.type === 'set') p(this).set = new Set();
    else if (config.type === 'map') p(this).map = new Map();
    else p(this).queue = [];
    
    p(this).add = getAdderFunction(this);
    p(this).clear = getClearFunction(this);

    this.configureSettings(config);

    p(this).state = {
      activeTimeout: null,
      bunchedCount: 0
    };

    p(this).callbacks = {
      onFlush: []
    };

    p(this).bunchHandler;

    if (config.Promise) Promise = config.Promise;

    resetPromise(this);
  }


  /**
   *
   */
  configureSettings({minBunchedCount, minWaitTime, canFlush} = {}) {
    p(this).settings = Object.assign((p(this).settings || {}), {
      minBunchedCount,
      minWaitTime
    });

    p(this).canFlush = canFlush || p(this).canFlush || (({minBunchedCount, minWaitTime} = {}) => {
      return (!minWaitTime && !minBunchedCount) ||
             (minWaitTime && !p(this).state.activeTimeout) ||
             (minBunchedCount && (p(this).state.bunchedCount >= minBunchedCount)); 
    });
  }


  /**
   *
   */
  forceFlush() {
    flush(this);
  }


  /**
   *
   */
  onFlush(callback) {
    p(this).callbacks.onFlush.push(callback);
  }


  /**
   *
   */
  setBunchHandler(callback) {
    p(this).bunchHandler = (result) => Promise.resolve(callback(result))
    .then(handled => handled === result ? result : Object.assign(result, {handled}));
  }


  /**
   *
   */
  bunch(item) {
    const promise = p(this).promise;

    p(this).add(item);
    p(this).state.bunchedCount++;

    const {state, settings} = p(this);

    if (settings.minWaitTime && !state.activeTimeout) {
      state.activeTimeout = setTimeout(() => {
        state.activeTimeout = null;
        if (p(this).canFlush(settings)) flush(this);
      }, settings.minWaitTime);
    }

    if (p(this).canFlush(settings)) flush(this);

    return promise
    .then((result) => (Object.assign({}, result, {item})));
  }
}


/**
 *
 */
function flush(bunchie) {
  p(bunchie).state.bunchedCount = 0;

  const bunch = p(bunchie).queue || p(bunchie).map || p(bunchie).set;
  p(bunchie).clear();

  p(bunchie).deferred.resolve({bunch});
  resetPromise(bunchie);

  p(bunchie).callbacks.onFlush.forEach(cb => cb(bunch));

  return bunch;
}


/**
 *
 */
function getAdderFunction(bunchie) {
  if (p(bunchie).set) return (item) => p(bunchie).set.add(item);
  if (p(bunchie).map) return (key, value) => p(bunchie).map.set(key, value);
  return (item) => p(bunchie).queue.push(item);
}


/**
 *
 */
function getClearFunction(bunchie) {
  // We create new sets and maps rather than clearing so that they can be
  // safely returned in a flush without called being able to manipulate internal
  // bunch.
  if (p(bunchie).set) return () => p(bunchie).set = new Set();
  if (p(bunchie).map) return () => p(bunchie).map = new Map();
  return () => p(bunchie).queue = [];
}


/**
 *
 */
function resetPromise(bunchie) {
  p(bunchie).promise = new Promise((resolve, reject) => {
    p(bunchie).deferred = ({resolve, reject});
  })
  .then(({bunch}) => p(bunchie).bunchHandler ? p(bunchie).bunchHandler({bunch}) : {bunch});
}


module.exports = Bunchie;
