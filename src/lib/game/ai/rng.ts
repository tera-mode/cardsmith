export interface Rng {
  next(): number;
  pickIndex(n: number): number;
  pick<T>(arr: T[]): T;
  shuffle<T>(arr: T[]): T[];
}

// mulberry32 — 軽量な32bit疑似乱数
export function createRng(seed: number): Rng {
  let s = seed >>> 0;

  function next(): number {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    pickIndex: (n: number) => Math.floor(next() * n),
    pick<T>(arr: T[]): T { return arr[Math.floor(next() * arr.length)]; },
    shuffle<T>(arr: T[]): T[] {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}
