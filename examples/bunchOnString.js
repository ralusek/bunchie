'use strict';

const { bunchOnString } = require('../');


const startedAt = Date.now();

bunchOnString('abcde', (...args) => {
  console.log('Timer', Date.now() - startedAt);
  console.log('Handled', ...args);
}, {maxTimeout: 1600})('Hi there')
.then((...args) => {
  console.log('Done.', ...args);
});
