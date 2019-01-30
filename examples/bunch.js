'use strict';

const { bunch } = require('../lib');


const startedAt = Date.now();

const test = bunch((...args) => {
  console.log('Timer', Date.now() - startedAt);
  console.log('Handled', ...args);

  return 'I am a result.';
}, {maxTimeout: 1600});

test('a')
.then((...args) => console.log('Done with A.', ...args));

test('b')
.then((...args) => console.log('Done with B.', ...args));

setTimeout(() => test('c'), 989);
setTimeout(() => test('d'), 1800);
setTimeout(() => test('e'), 2900);
