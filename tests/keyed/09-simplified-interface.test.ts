import 'mocha';
import { expect } from 'chai';

import { keyed } from '../../lib';

describe('simplified interface', () => {
  it('should just pass in last argument set to handler and only return result', async () => {
    let handlerWasCalled = false;
    const bunched = keyed('key', (str: string, num: number) => {
      handlerWasCalled = true;
      expect([str, num].join('')).to.equal('c3');
      return 'hello';
    }, { includeAllBatchArguments: false, includeMetadataInResponse: false });
    
    const [ response ] = await Promise.all([
      bunched('a', 1),
      bunched('b', 2),
      bunched('c', 3),
    ]);

    expect(response).to.equal('hello');
    expect(handlerWasCalled).to.be.true;
  });
});
