[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ralusek/bunchie/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/bunchie.svg?style=flat)](https://www.npmjs.com/package/bunchie)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ralusek/bunchie/blob/master/LICENSE)

This is a utility to batching together many individual calls by timing or by
count before proceeding as a batch.

## Example

We want to pool multiple read requests to a cache together to take advantage of
multi-get performance.

Say our code initially looks like this:

```javascript
function readFromCache(key) {
  return cache.get(key);
}
```

Every time we call `readFromCache`, we do a single call to the cache. If we did
1000 requests within 200ms, it would do 1000 individual calls.

In order to let these bunch up for a multi-get, we can use `bunchie`.

```javascript
import { bunch } from 'bunchie';


const readFromCache = bunch((keys) => {
  return cache.multiGet(keys);
});
```

Now `readFromCache` will batch up requests before hitting the cache. We'll want
to add some configuration.

Say that we want to wait 50 milliseconds for additional requests to the cache,
otherwise we invoke the handler. We do this by adding a `debounce` property to
the config.

```javascript
const readFromCache = bunch((keys) => {
  return cache.multiGet(keys);
}, {
  debounce: 50
});
```

Now `readFromCache` can be invoked, and will wait up to 50ms for another request
to come in before going to the cache. This is good, but we don't want to let this
process be pushed back indefinitely, so let's say we'd like to have this go on
for a maximum of 200ms. We do this through the `maxTimeout` property.

```javascript
const readFromCache = bunch((keys) => {
  return cache.multiGet(keys);
}, {
  debounce: 50,
  maxTimeout: 200
});
```

And finally, let's say that there is a maximum amount of invocations we'd like
to handle within a timeout before moving forward with the handle. Say we get 2000
requests in this 200ms period, and we only want to handle up to 100 keys in a single
`multiGet` request. We do this through the `maxCount` property.

```javascript
const readFromCache = bunch((keys) => {
  return cache.multiGet(keys);
}, {
  debounce: 50,
  maxTimeout: 200,
  maxCount: 100
});
```

So the result is, we could have these 3 requests come in as follows:
```javascript
readFromCache('harry');
readFromCache('sally');
readFromCache('billy');
```

And given that they've all occured within 50ms of one another, the handler function
will be invoked with a `keys` value of `[['harry'], ['sally'], ['billy']]`, so
we can do an efficient `multiGet` from the cache!


## Advanced Example

In the example above, let's say that `cache.multiGet` takes an array of keys, and
returns an array of responses in the same order. As we have it in that example,
the response to each of the `readFromCache` requests will be the array of responses
in that batch. Let's have it instead map the response to the corresponding key.
Invoking a `bunch`ed function actually provides some useful information in the
response object, namely an `index` property to indicate in what order this invocation
was done in. We can use this to map the cache response to the key. The `result`
property contains the result of the handler function.

```javascript
const bunchedCache = bunch((keys) => {
  return cache.multiGet(keys);
}, {
  debounce: 50,
  maxTimeout: 200,
  maxCount: 100
});
async function readFromCache(key) {
  const { index, result } = await bunchedCache(key);
  // `index` is the index this `key` is in the `multiGet`, and `result` is an array
  // of responses from the `multiGet`.
  return result[index];
}
```

So now we can do:

```javascript
// Even though behind the scenes `readFromCache` bunched my requests together
// and got an array response, we now still get specifically the harryResult!
const harryResult = await readFromCache('harry');
```
