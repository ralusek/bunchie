import 'mocha';
import { expect } from 'chai';

import { keyed } from '../../lib';
import { Result } from '../../lib/types';

const timeoutPromise = async (fn: () => void, timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(fn()), timeout);
  });
};

describe('debouncing and timing', () => {
  it('should debounce calls as expected.', async () => {
    const bunched = keyed('key', () => 'hello', { maxTimeout: 300, debounce: 100, includeAllBatchArguments: true, includeMetadataInResponse: true });

    const aPromise = bunched('a');
    await timeoutPromise(() => { bunched('b') }, 80);
    await timeoutPromise(() => { bunched('c') }, 80);
    await timeoutPromise(() => { bunched('d') }, 80);
    await timeoutPromise(() => {}, 200);

    const ePromise = bunched('e');
    await timeoutPromise(() => { bunched('f') }, 50);
    
    const [a, e] = await Promise.all([aPromise, ePromise]);


    expect(a.result).to.equal('hello');
    expect(a.index).to.equal(0);
    expect(a.arguments.join('')).to.equal('a');
    expect(a.bunch.size).to.equal(4);
    a.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(1);
    });
    expect(a.bunch.arguments.join(', ')).to.equal('a, b, c, d');

    expect(e.result).to.equal('hello');
    expect(e.index).to.equal(0);
    expect(e.arguments.join('')).to.equal('e');
    expect(e.bunch.size).to.equal(2);
    e.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(1);
    });
    expect(e.bunch.arguments.join(', ')).to.equal('e, f');
  });

  it('should stop debouncing upon hitting maxTimout', async () => {
    const bunched = keyed('key', (x: [string][]) => 'hello', { maxTimeout: 150, debounce: 100, includeAllBatchArguments: true, includeMetadataInResponse: true });

    const aPromise = bunched('a');
    let cPromise: Promise<Result<[string], string>> = new Promise(() => {});
    await timeoutPromise(() => { bunched('b') }, 80);
    await timeoutPromise(() => { cPromise = bunched('c') }, 80);
    await timeoutPromise(() => { bunched('d') }, 80);
    await timeoutPromise(() => {}, 200);

    const ePromise = bunched('e');
    await timeoutPromise(() => { bunched('f') }, 50);
    
    const [a, c, e] = await Promise.all([aPromise, cPromise, ePromise]);


    expect(a.result).to.equal('hello');
    expect(a.index).to.equal(0);
    expect(a.arguments.join('')).to.equal('a');
    expect(a.bunch.size).to.equal(2);
    a.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(1);
    });
    expect(a.bunch.arguments.join(', ')).to.equal('a, b');

    if (!c) throw new Error('should not be undefined'); // for ts
    expect(c.result).to.equal('hello');
    expect(c.index).to.equal(0);
    expect(c.arguments.join('')).to.equal('c');
    expect(c.bunch.size).to.equal(2);
    c.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(1);
    });
    expect(c.bunch.arguments.join(', ')).to.equal('c, d');

    expect(e.result).to.equal('hello');
    expect(e.index).to.equal(0);
    expect(e.arguments.join('')).to.equal('e');
    expect(e.bunch.size).to.equal(2);
    e.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(1);
    });
    expect(e.bunch.arguments.join(', ')).to.equal('e, f');
  });
});
