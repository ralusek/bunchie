import 'mocha';
import { expect } from 'chai';

import { keyed } from '../../lib';

describe('argument bunching', () => {
  it('should bunch arguments as expected.', async () => {
    const bunched = keyed(() => 'hello');
    
    const [ response ] = await Promise.all([
      bunched('key', 'a'),
      bunched('key', 'b'),
      bunched('key', 'c'),
    ]);

    expect(response.result).to.equal('hello');
    expect(response.index).to.equal(0);
    expect(response.arguments.join('')).to.equal('a');
    expect(response.bunch.size).to.equal(3);
    response.bunch.arguments.forEach((argumentSet) => {
      expect(Array.isArray(argumentSet)).to.be.true;
      expect(argumentSet.length).to.equal(1);
    });
    expect(response.bunch.arguments.join(', ')).to.equal('a, b, c');
  });
});
