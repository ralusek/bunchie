import 'mocha';
import { expect } from 'chai';

import { bunch } from '../../lib';

describe('max invocation', () => {
  it('should run a bunch upon reaching max invocations.', async () => {
    const bunched = bunch((args) => 'hello', { maxCount: 3 });
    
    const [ responseA, b, c, responseD, e ] = await Promise.all([
      bunched('a'),
      bunched('b'),
      bunched('c'),
      bunched('d'),
      bunched('e'),
    ]);

    expect(responseA.result).to.equal('hello');
    expect(responseA.index).to.equal(0);
    expect(responseA.arguments.join('')).to.equal('a');
    expect(responseA.bunch.size).to.equal(3);
    responseA.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(1);
    });
    expect(responseA.bunch.arguments.join(', ')).to.equal('a, b, c');

    expect(responseD.result).to.equal('hello');
    expect(responseD.index).to.equal(0);
    expect(responseD.arguments.join('')).to.equal('d');
    expect(responseD.bunch.size).to.equal(2);
    responseD.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(1);
    });
    expect(responseD.bunch.arguments.join(', ')).to.equal('d, e');
  });
});
