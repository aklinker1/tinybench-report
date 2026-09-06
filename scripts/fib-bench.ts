import { Bench } from "tinybench";

const recursiveCache: Record<number, number> = {
  0: 0,
  1: 1,
};
const recursiveFib = (n: number): number => {
  if (recursiveCache[n] != null) return recursiveCache[n];
  const res = recursiveFib(n - 1) + recursiveFib(n - 2);
  recursiveCache[n] = res;
  return res;
};

const iterativeFib = (n: number): number => {
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i++) {
    [a, b] = [b, a + b];
  }
  return a;
};

export const bench = new Bench({
  name: "Fibonacci",
})
  .add("Recursive", () => recursiveFib(100))
  .add("Iterative", () => iterativeFib(100));
