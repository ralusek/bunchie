import 'mocha';
import { expect } from 'chai';

import { keyed } from '../../lib';

describe('constructed key', () => {
  it('should bunch arguments as expected.', async () => {
    const bunched = keyed((key: string, ...args) => key, () => 'hello', { includeAllBatchArguments: true, includeMetadataInResponse: true });
    
    const [a, b, c] = await Promise.all([
      bunched('key1', 'a', 1),
      bunched('key1', 'b', 2),
      bunched('key2', 'c', 3),
    ]);

    expect(a.key.join('')).to.equal('key1');
    expect(b.key.join('')).to.equal('key1');
    expect(a.result).to.equal('hello');
    expect(a.index).to.equal(0);
    expect(b.index).to.equal(1);
    expect(a.arguments.slice(1).join('')).to.equal('a1');
    expect(a.bunch.size).to.equal(2);
    a.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(3);
    });
    expect(a.bunch.arguments.map(args => args.slice(1)).join(', ')).to.equal('a,1, b,2');

    expect(c.key.join('')).to.equal('key2');
    expect(c.result).to.equal('hello');
    expect(c.index).to.equal(0);
    expect(c.arguments.slice(1).join('')).to.equal('c3');
    expect(c.bunch.size).to.equal(1);
    c.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(3);
    });
    expect(c.bunch.arguments.map(args => args.slice(1)).join(', ')).to.equal('c,3');
  });
});
