export default function awaitTimeout(timeout: number) {
  return new Promise((resolve) => setTimeout(() => resolve(null), timeout));
}
