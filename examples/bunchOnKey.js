'use strict';

const { bunchOnKey } = require('../lib');


const startedAt = Date.now();

bunchOnKey('abcde', (...args) => {
  console.log('Timer', Date.now() - startedAt);
  console.log('Handled', ...args);
}, {maxTimeout: 1600})('Hi there')
.then((...args) => {
  console.log('Done.', ...args);
});

bunchOnKey('abcde', (...args) => {
  console.log('Timer', Date.now() - startedAt);
  console.log('Handled', ...args);
}, {maxTimeout: 1600})('Hello')
.then((...args) => {
  console.log('Done.', ...args);
});

bunchOnKey('abcde', (...args) => {
  console.log('Timer', Date.now() - startedAt);
  console.log('Handled', ...args);
}, {maxTimeout: 1600})()
.then((...args) => {
  console.log('Done.', ...args);
});
