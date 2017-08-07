'use strict';


// This establishes a private namespace.
const namespace = new WeakMap();
function p(object) {
  if (!namespace.has(object)) namespace.set(object, {});
  return namespace.get(object);
}


const CONFIG = Object.freeze({
  default: Object.freeze({
    minCount: 0,
    minWait: 0,
    // Whether or not to dispose of a scoped bunchie on flush.
    dispose: true,

    canFlush: (bunchie, {minWait, minCount}) => {
      let count = 0;
      for (let prop in p(bunchie).count) {
        count += p(bunchie).count[prop];
      }

      return (!minWait && !minCount) ||
             (minWait && !p(bunchie).activeTimeout) ||
             (minCount && (count >= minCount)); 
    }
  }),
  global: {}
});


/**
 *
 */
class Bunchie {
  /**
   *
   */
  constructor(config = {}) {
    this.configure(config);

    p(this).parent = config.parent;
    p(this).scope = config.scope;

    p(this).set = new Set();
    p(this).map = new Map();
    p(this).list = [];

    p(this).count = {
      single: 0,

      set: 0,
      map: 0,
      list: 0
    };

    p(this).scopes = new Map();

    p(this).middleware = [];

    p(this).activeTimeout;

    if (config.Promise) Promise = config.Promise;

    resetPromise(this);
  }

  /**
   *
   */
  configure(config = {}, scope) {
    const bunchie = this.scoped(scope);
    p(bunchie).config = Object.assign({}, p(bunchie).config || {}, config);
  }


  /**
   *
   */
  canFlush() {
    const minWait = this.getConfigValue('minWait');
    const minCount = this.getConfigValue('minCount');

    const count = Object.assign({}, p(this).count);

    const canFlush = this.getConfigValue('canFlush');

    return canFlush(this, {count, minCount, minWait});
  }

  /**
   *
   */
  flush({dispose, type} = {}) {
    if (this.canFlush()) this.forceFlush({dispose, type});
  }


  /**
   *
   */
  forceFlush({dispose, type}) {
    if (!type) {
      const inUse = [
        ~~!!p(this).count.single,
        ~~!!p(this).set.size,
        ~~!!p(this).map.size,
        ~~!!p(this).list.length
      ];
      if (inUse.reduce((sum, value) => sum + value, 0) > 1) throw new Error('Cannot flush Bunchie, more than one type of tracking was used and none specified. Must specify "single", "set", "map", or "list".');
      type = inUse[0] ? 'single' :
             inUse[1] ? 'set' :
             inUse[2] ? 'map' : 'list';
    }

    // Clear timeout
    p(this).activeTimeout = clearTimeout(p(this).activeTimeout);

    const deferred = p(this).deferred;
    resetPromise(this);

    const bunch = clear[type](this);
    if (p(this).parent && this.getConfigValue('dispose', {dispose})) p(this).parent.scopeDispose(p(this).scope);

    deferred.resolve({bunch});
  }


  /**
   *
   */
  single(scope, config) {
    const bunchie = this.scoped(scope, config);

    const promise = p(bunchie).promise;

    p(bunchie).count.single++;
    handleTimeout(bunchie);

    bunchie.flush({type: 'single'});

    return promise
    .then(result => Object.assign({}, result, {scope}));
  }


  /**
   *
   */
  add(value, scope) {
    const bunchie = this.scoped(scope);

    const promise = p(bunchie).promise;
    
    p(bunchie).set.add(value);
    p(bunchie).count.set++;
    handleTimeout(bunchie);

    bunchie.flush({type: 'set'});

    return promise
    .then(result => Object.assign({}, result, {value, scope}));
  }


  /**
   *
   */
  set(key, value, scope) {
    const bunchie = this.scoped(scope);

    const promise = p(bunchie).promise;
    
    p(bunchie).map.set(key, value);
    p(bunchie).count.map++;
    handleTimeout(bunchie);

    bunchie.flush({type: 'map'});

    return promise
    .then(result => Object.assign({}, result, {key, value, scope}));
  }


  /**
   *
   */
  push(value, scope) {
    const bunchie = this.scoped(scope);

    const promise = p(bunchie).promise;
    
    p(bunchie).list.push(value);
    p(bunchie).count.list++;
    handleTimeout(bunchie);

    bunchie.flush({type: 'list'});

    return promise
    .then(result => Object.assign({}, result, {value, scope}));
  }


  /**
   *
   */
  addMiddleware(middleware, scope) {
    const bunchie = this.scoped(scope);
    p(bunchie).middleware.push(middleware);
  }


  /**
   *
   */
  scoped(scope, config) {
    let scoped;
    if (scope) {
      scoped = p(this).scopes.get(scope) || new Bunchie({parent: this});
      p(this).scopes.set(scope, scoped);
    }
    else scoped = this;

    if (config) scoped.configure(config);
    return scoped;
  }


  /**
   *
   */
  scopeDispose(scope) {
    p(this).scopes.delete(p(this).scope);
  }


  /**
   *
   */
  getConfigValue(key, config = {}) {
    return config[key] !== undefined ?
      config[key] :
    (p(this).config[key] !== undefined) ?
      p(this).config[key] :
    (CONFIG.global[key] !== undefined) ?
      CONFIG.global[key] :
    CONFIG.default[key];
  }
}


/**
 *
 */
const clear = {
  single: bunchie => {
    const single = p(bunchie).single;
    p(bunchie).count.single = 0;
    return single;
  },
  set: bunchie => {
    const set = p(bunchie).set;
    p(bunchie).set = new Set();
    p(bunchie).count.set = 0;
    return set;
  },
  map: bunchie => {
    const map = p(bunchie).map;
    p(bunchie).map = new Map();
    p(bunchie).count.map = 0;
    return map;
  },
  list: bunchie => {
    const list = p(bunchie).list;
    p(bunchie).list = new Set();
    p(bunchie).count.list = 0;
    return list;
  }
};


/**
 *
 */
function handleTimeout(bunchie) {
  const minWait = bunchie.getConfigValue('minWait');
  if (!minWait || p(bunchie).activeTimeout) return;
  p(bunchie).activeTimeout = setTimeout(() => {
    p(bunchie).activeTimeout = null;
    bunchie.flush();
  }, minWait);
}


/**
 *
 */
function handleMiddleware(middleware, payload) {
  let chain = Promise.resolve(middleware[0] ? middleware[0](payload) : payload);
  for (let i = 1; i < middleware.length; i++) {
    chain = chain.then(() => middleware[i](payload));
  }
  return chain;
}


/**
 *
 */
function resetPromise(bunchie) {
  p(bunchie).promise = new Promise((resolve, reject) => {
    p(bunchie).deferred = ({resolve, reject});
  })
  .then(payload => handleMiddleware(p(bunchie).middleware, payload));
}


module.exports = new Bunchie();
