import 'mocha';
import { expect } from 'chai';

import { keyed } from '../../lib';
import { Result } from '../../lib/types';

const timeoutPromise = async <T>(fn: () => T, timeout: number): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(fn()), timeout);
  });
};

describe('argument bunching', () => {
  it('should bunch arguments as expected.', async () => {
    const bunched = keyed((argBunch: [string][]) => timeoutPromise(() => 'hello', 10), { debounce: 100 });
    
    const aPromise = bunched('key1', 'a');
    const dPromise = bunched('key2', 'd');
    let fPromise: Promise<Result<[string], string>> = new Promise(() => {});

    await timeoutPromise(() => { bunched('key2', 'e') }, 10);
    await timeoutPromise(() => { bunched('key1', 'b') }, 10);
    await timeoutPromise(() => { bunched('key1', 'c') }, 10);
    await timeoutPromise(() => { fPromise = bunched('key2', 'f') }, 120);
    
    const [a, d, f] = await Promise.all([aPromise, dPromise, fPromise]);

    expect(a.result).to.equal('hello');
    expect(a.index).to.equal(0);
    expect(a.arguments.join('')).to.equal('a');
    expect(a.bunch.size).to.equal(3);
    a.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(1);
    });
    expect(a.bunch.arguments.join(', ')).to.equal('a, b, c');

    expect(d.result).to.equal('hello');
    expect(d.index).to.equal(0);
    expect(d.arguments.join('')).to.equal('d');
    expect(d.bunch.size).to.equal(2);
    d.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(1);
    });
    expect(d.bunch.arguments.join(', ')).to.equal('d, e');

    expect(f.result).to.equal('hello');
    expect(f.index).to.equal(0);
    expect(f.arguments.join('')).to.equal('f');
    expect(f.bunch.size).to.equal(1);
    f.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(1);
    });
    expect(f.bunch.arguments.join(', ')).to.equal('f');
  });
});
