import 'mocha';
import { expect } from 'chai';

import { keyed } from '../../lib';

describe('Invocation', () => {
  it('should be able to be executed.', async () => {
    const bunched = keyed('hi', () => {}, { includeAllBatchArguments: true, includeMetadataInResponse: true });
    expect(bunched).to.not.be.undefined;
    expect(typeof bunched).to.equal('function');
    let resolved = false;
    let errored = false;
    await (bunched()
    .then(() => resolved = true)
    .catch(err => errored = true));

    expect(resolved).to.be.true;
    expect(errored).to.be.false;
  });
});
