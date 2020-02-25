'use strict';

const { bunch } = require('../lib');


const startedAt = Date.now();

const test = bunch((...args) => {
  console.log('Timer', Date.now() - startedAt);
  console.log('Handled', ...args);

  return 'I am a result. ' + args.join(', ');
}, {maxTimeout: 1600});

// We invoke A and B together.
test('a')
.then((...args) => console.log('Done with A.', ...args));

test('b')
.then((...args) => console.log('Done with B.', ...args));

test()
.then((...args) => console.log('Done with Blank', ...args));

// Because we invoke C within the maxTimeout of 1600, it will be batched with a and b.
setTimeout(() => test('c'), 900);

// Because we invoke D and E at 1800, outside of the maxTimeout of 1600 we used, these will be batched
// together in a subsequent batch.
setTimeout(() => test('d'), 1800);
setTimeout(() => {
  test('e')
  .then((...args) => console.log('Done with E.', ...args));
}, 1900);
