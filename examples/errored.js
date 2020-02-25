'use strict';

const { bunch, bunchOnKey } = require('../lib');


const test = bunch(() => {
  return Promise.reject(new Error('I am an error'));
});


test('A')
.catch(err => console.log('Error A:', err.message, err.bunchieMeta));

test('B')
.catch(err => console.log('Error B:', err.message, err.bunchieMeta));

bunchOnKey('abcde', (...args) => {
  return Promise.reject(new Error('I am an error'));
})()
.catch((err) => console.log('Error C:', err.message, err.bunchieMeta));
