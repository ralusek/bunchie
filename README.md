This is a utility to batching together many individual calls by timing or by
count before moving forward.

An example utility might be that we wanted to be able to many requests to a cache,
but rather than making thousands of requests, we'd rather the requests pool
together to minimize the actual requests we make to the cache. If we wanted to
do this, we would have to attempt to manage all of these requests together, to
coordinate this, when our business logic would be much better of just not worrying
about such things.


So we could have a cache function like:

```javascript
const Bunchie = require('bunchie');
const bunchie = new Bunchie({
  minWaitTime: 100, // We let requests bunch up over 500ms before executing the call to the cache.
  type: 'set'
});

bunchie.setBunchHandler(({bunch}) => {
  // Assume responses are keyed by their request key, so if I requested
  // 'person_1234', this response object would have {person_1234: {...persons informaiton}}
  return redis.mget(Array.from(bunch));
});

cache.get = (key) => {
  bunchie.bunch(key)
  .then(({item, bunch, handled}) => {
    // This will be called after the handler we defined in setBunchHandler, which
    // is for handling the bunch collectively. The result of the setBunchHandler
    // function is added onto "handled" property, available here.

    // The redis responses were keyed by the request key, so we can get the
    // specific response we're looking for like this.
    return handled[key];
  })
};
```



So then in your code, you could now simply call `cache.get('some_cache_key')`
without having to worry about making thousands of individual requests to the
cache, as they'll be bunched together into an mget behind the scenes.
