import 'mocha';
import { expect } from 'chai';

import { keyed } from '../../lib';

describe('argument bunching', () => {
  it('should bunch arguments as expected.', async () => {
    const bunched = keyed(() => 'hello');
    
    const [ a, b, c, d ] = await Promise.all([
      bunched('key1', 'a'),
      bunched('key1', 'b'),
      bunched('key2', 'c'),
      bunched('key2', 'd'),
    ]);

    expect(a.result).to.equal('hello');
    expect(a.index).to.equal(0);
    expect(a.arguments.join('')).to.equal('a');
    expect(a.bunch.size).to.equal(2);
    a.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(1);
    });
    expect(a.bunch.arguments.join(', ')).to.equal('a, b');
    expect(c.result).to.equal('hello');
    expect(c.index).to.equal(0);
    expect(c.arguments.join('')).to.equal('c');
    expect(c.bunch.size).to.equal(2);
    c.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(1);
    });
    expect(c.bunch.arguments.join(', ')).to.equal('c, d');
  });
});
