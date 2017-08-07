This is a utility to batching together many individual calls by timing or by
count before proceeding as a batch.

An example utility might be that we wanted to be able to many requests to a cache,
but rather than making thousands of requests, we'd rather the requests pool
together to minimize the actual requests we make to the cache. If we wanted to
do this, we would have to attempt to manage all of these requests together, to
coordinate this, when our business logic would be much better of just not worrying
about such things.

Imagine that a very common action is to update the cached count value for items.
Maybe this is done by doing a SQL count operation and then updating the count
value in redis. If this were to happen hundreds of times per second, it would
be a total waste to recount the values each time to refresh the count. We could
bunch the requests made to update a record's count using the `single` call.

Given this as our code without bunching, we can see that all calls to `refreshCount`
are going to go to the DB, count the records, and go to the cache.
```javascript
function refreshCount(id) {
  return expensiveDBCount(id)
  .then(count => updateCacheCount(id, count));
}
```

We could instead change the code to use bunching, so that hundreds or thousands
of calls within a time frame will be bundled together to avoid going to the db.
```javascript
function refreshCount(id) {
  bunchie.single(id, {minWait: 300}) // We let requests bunch up over 500ms before executing the call to the cache.
  .then(() => expensiveDBCount(id))
  .then(count => updatedCacheCount(id, count));
}
```

We've now added a blockage that will wait 300ms to bunch on a single value, in
this case the `id` of the record to refresh the count for. Each new id encountered
will begin its own timer, and after 300ms has passed, the bunchie's promise is
resolved and the db will be counted and the cache updated. If 1 or 10,000 requests
came in to update a single record, we're still only making one db call.



If we don't want to have this behavior per single value, for which we used `single`
in the example above, we can instead use `add` to push values to a set for bunching.
An example use case of this would be that we make calls to retrieve from a cache,
but not only would we like to deduplicate requests for the same value, but we'd
also like to batch all requests to the cache together as a group, so that we can
use `mget` multiget rather than many different requests.

```javascript
bunchie.config({
  minWait: 300 // We let requests bunch up over 500ms before executing the call to the cache.
});

// We add middleware to process the bunch that is being resolved as a bunched
// unit, prior to going to the resolution of all of the individual promises.
bunchie.addMiddleware((payload) => {
  // Assume responses are keyed by their request key, so if I requested
  // 'person_1234', this response object would have {person_1234: {...persons informaiton}}
  return redis.mget(Array.from(payload.bunch))
  .then(response => Object.assign(payload, {mgetResponse: response}));
});

cache.get = (key) => {
  bunchie.bunch(key)
  .then(({item, bunch, mgetResponse}) => {
    // This will be called after the middleware, which is for handling the bunch
    // collectively.

    // The redis responses were keyed by the request key, so we can get the
    // specific response we're looking for like this.
    return mgetResponse[key];
  });
};
```



So then in your code, you could now simply call `cache.get('some_cache_key')`
without having to worry about making thousands of individual requests to the
cache, as they'll be bunched together into an mget behind the scenes.
