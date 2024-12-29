export const sleep = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

export function shiftMap<K, V>(map: Map<K, V>): [K, V] | undefined {
  const next = map[Symbol.iterator]().next();
  if (next.value) map.delete(next.value[0]);
  return next.value;
}

export function shiftSet<T>(set: Set<T>): T | undefined {
  const next = set[Symbol.iterator]().next();
  if (next.value) set.delete(next.value);
  return next.value;
}
