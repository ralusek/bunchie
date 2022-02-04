import 'mocha';
import { expect } from 'chai';

import { keyed } from '../../lib';

describe('max invocation', () => {
  it('should run a bunch upon reaching max invocations.', async () => {
    const bunched = keyed(() => 'hello', { maxCount: 3 });
    
    const [ responseA, b, c, responseD, e ] = await Promise.all([
      bunched('key', 'a'),
      bunched('key', 'b'),
      bunched('key', 'c'),
      bunched('key', 'd'),
      bunched('key', 'e'),
    ]);

    expect(responseA.result).to.equal('hello');
    expect(responseA.index).to.equal(0);
    expect(responseA.argument).to.equal('a');
    expect(responseA.bunch.size).to.equal(3);
    expect(responseA.bunch.arguments.join(', ')).to.equal('a, b, c');

    expect(responseD.result).to.equal('hello');
    expect(responseD.index).to.equal(0);
    expect(responseD.argument).to.equal('d');
    expect(responseD.bunch.size).to.equal(2);
    expect(responseD.bunch.arguments.join(', ')).to.equal('d, e');
  });
});