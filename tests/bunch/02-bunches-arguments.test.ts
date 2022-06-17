import 'mocha';
import { expect } from 'chai';

import { bunch } from '../../lib';

describe('argument bunching', () => {
  it('should bunch arguments as expected.', async () => {
    const bunched = bunch(() => 'hello');
    
    const [ response ] = await Promise.all([
      bunched('a'),
      bunched('b'),
      bunched('c'),
    ]);

    expect(response.result).to.equal('hello');
    expect(response.index).to.equal(0);
    expect(response.argument).to.equal('a');
    expect(response.bunch.size).to.equal(3);
    expect(response.bunch.arguments.join(', ')).to.equal('a, b, c');
  });
});
