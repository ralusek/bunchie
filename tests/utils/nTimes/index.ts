export default function nTimes<R extends any>(n: number, fn: (n: number) => R): R[] {
  const results: R[] = []
  for (let i = 0; i < n; i++) {
    results.push(fn(i))
  }

  return results;
}
