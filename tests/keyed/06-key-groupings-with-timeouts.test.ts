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
    const bunched = keyed((key: string, value: string) => key, (argBunch: [string, string][]) => timeoutPromise(() => 'hello', 10), { debounce: 100, includeAllBatchArguments: true, includeMetadataInResponse: true });
    
    const aPromise = bunched('key1', 'a');
    const dPromise = bunched('key2', 'd');
    let fPromise: Promise<Result<[string, string], string>> = new Promise(() => {});

    await timeoutPromise(() => { bunched('key2', 'e') }, 10);
    await timeoutPromise(() => { bunched('key1', 'b') }, 10);
    await timeoutPromise(() => { bunched('key1', 'c') }, 10);
    await timeoutPromise(() => { fPromise = bunched('key2', 'f') }, 120);
    
    const [a, d, f] = await Promise.all([aPromise, dPromise, fPromise]);

    expect(a.result).to.equal('hello');
    expect(a.index).to.equal(0);
    expect(a.arguments.slice(1).join('')).to.equal('a');
    expect(a.bunch.size).to.equal(3);
    a.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(2);
    });
    expect(a.bunch.arguments.map(args => args.slice(1)).join(', ')).to.equal('a, b, c');

    expect(d.result).to.equal('hello');
    expect(d.index).to.equal(0);
    expect(d.arguments.slice(1).join('')).to.equal('d');
    expect(d.bunch.size).to.equal(2);
    d.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(2);
    });
    expect(d.bunch.arguments.map(args => args.slice(1)).join(', ')).to.equal('d, e');

    expect(f.result).to.equal('hello');
    expect(f.index).to.equal(0);
    expect(f.arguments.slice(1).join('')).to.equal('f');
    expect(f.bunch.size).to.equal(1);
    f.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(2);
    });
    expect(f.bunch.arguments.map(args => args.slice(1)).join(', ')).to.equal('f');
  });
});
