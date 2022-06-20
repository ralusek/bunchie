import 'mocha';
import { expect } from 'chai';

import { bunch } from '../../lib';

describe('simplified interface', () => {
  it('should just pass in last argument set to handler and only return result', async () => {
    let handlerWasCalled = false;
    const bunched = bunch((args) => {
      handlerWasCalled = true;
      expect(args.join('')).to.equal('c');
      return 'hello';
    }, { includeAllBatchArguments: false, includeMetadataInResponse: false });
    
    const [ response ] = await Promise.all([
      bunched('a'),
      bunched('b'),
      bunched('c'),
    ]);

    expect(response).to.equal('hello');
    expect(handlerWasCalled).to.be.true;
  });
});
