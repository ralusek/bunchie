import awaitTimeout from "../awaitTimeout";

const used = process.memoryUsage().heapUsed / 1024 / 1024;

type Config = {
  label: string;
  maxIncreasedCount?: number;
  restForGC?: number;
};

export default function getMemoryLeakTester({
  label,
  maxIncreasedCount = 10,
  restForGC = 100,
}: Config) {
  let max = getMemoryUsage();
  const startingMax = max;
  const startTime = Date.now();
  let increasedCount = 0;
  return async function checkForLeak() {
    await awaitTimeout(restForGC);

    const used = getMemoryUsage();
    if (used > max) {
      max = used;
      if (++increasedCount > maxIncreasedCount) throw new Error(`Memory Leak "${label}" detected, with a total increase of ${used - startingMax} over ${(Date.now() - startTime) / 1000} seconds.`)
    }
  };
}

function getMemoryUsage() {
  return process.memoryUsage().heapUsed / 1024 / 1024;
}
