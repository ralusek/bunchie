'use strict';

const bunchie = require('./');


const countBased = bunchie.scoped('countBased', {
  minCount: 3
});


countBased.add('a')
.then(x => console.log('a:', x));
countBased.add('b')
.then(x => console.log('b:', x));
countBased.add('c')
.then(x => console.log('c:', x));
countBased.add('d')
.then(x => console.log('d:', x));
countBased.add('e')
.then(x => console.log('e:', x));
countBased.add('f')
.then(x => console.log('f:', x));


const singleVersion = bunchie.scoped('single');
singleVersion.single('test', {minCount: 3})
.then(x => console.log('Single test 1', x));

singleVersion.single('test')
.then(x => console.log('Single test 2', x));

singleVersion.single('test')
.then(x => console.log('Single test 3', x));


const timeBased = bunchie.scoped('timeBased', {minWait: 1000});

timeBased.addMiddleware((payload) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      payload.example = 'I handled this.';
      resolve(payload);
    }, 1500);
  });
});

timeBased.add('1')
.then(x => console.log('1:', x));
timeBased.add('2')
.then(x => console.log('2:', x));
timeBased.add('3')
.then(x => console.log('3:', x));


setTimeout(() => {
  timeBased.add('4')
  .then(x => console.log('4:', x));
}, 500);

setTimeout(() => {
  timeBased.add('5')
  .then(x => console.log('5:', x));
  timeBased.add('6')
  .then(x => console.log('6:', x));
}, 1200);
