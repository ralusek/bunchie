import { all } from 'indigobird';

import { keyed } from '../../lib';
import getMemoryLeakTester from '../utils/memoryLeakTester';
import nTimes from '../utils/nTimes';

const testForMemoryLeak = getMemoryLeakTester({ label: 'test', restForGC: 20, maxIncreasedCount: 200 });


describe('memory leaks', () => {
  it('it should maintain stable memory usage over many keys', async () => {
    const bunched = keyed(() => 'hello', { debounce: 10, maxTimeout: 30});

    async function test(prefix: string = '') {
      const promises: Promise<any>[] = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(bunched(() => `key${prefix}${i}`, 'a', 1));
      }

      await Promise.all(promises)
      return testForMemoryLeak();
    }

    await Promise.all([
      test(),
      test(),
      test(),
      test('hey'),
      test('hey'),
      test('hi'),
      test('yo'),
    ]);

    await all(nTimes(1000, i => i), (i) => {
      if (!(i % 50)) {
        console.log(`${(i * 100) / 1000}%`, `of the way done with test.`);
        global?.gc?.(); // Force garbage collection
      }
      return test(i < 500 ? `${i}`: 'hi');
    }, { concurrency: 1})
    
  }).timeout(1000 * 60);
});