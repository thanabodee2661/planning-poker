export function groupBy<T, K extends keyof any>(array: T[], key: (item: T) => K): Record<K, T[]> {
  return array.reduce((result, currentValue) => {
    const groupKey = key(currentValue);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(currentValue);
    return result;
  }, {} as Record<K, T[]>);
}

// Example function: Checks if an object is empty
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}