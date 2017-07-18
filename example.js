'use strict';

const Bunchie = require('./');


const countBased = new Bunchie({minBunchedCount: 3, type: 'set'});


countBased.bunch('a')
.then(x => console.log('a:', x));
countBased.bunch('b')
.then(x => console.log('b:', x));
countBased.bunch('c')
.then(x => console.log('c:', x));
countBased.bunch('d')
.then(x => console.log('d:', x));
countBased.bunch('e')
.then(x => console.log('e:', x));
countBased.bunch('f')
.then(x => console.log('f:', x));


const timeBased = new Bunchie({minWaitTime: 1000, type: 'set'});


timeBased.setBunchHandler(x => {
  return new Promise((resolve) => {
    setTimeout(() => {
      x.example = 'I handled this.';
      resolve(x);
    }, 1500);
  });
});


timeBased.bunch('1')
.then(x => console.log('1:', x));
timeBased.bunch('2')
.then(x => console.log('2:', x));
timeBased.bunch('3')
.then(x => console.log('3:', x));

setTimeout(() => {
  timeBased.bunch('4')
  .then(x => console.log('4:', x));
}, 500);

setTimeout(() => {
  timeBased.bunch('5')
  .then(x => console.log('5:', x));
  timeBased.bunch('6')
  .then(x => console.log('6:', x));
}, 1200);


timeBased.onFlush(bunch => {
  console.log('Flushed', bunch);
});
