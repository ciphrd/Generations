export function aggregate(arr, getKey) {
  let key
  const aggregates = {}
  for (const it of arr) {
    key = getKey(it)
    if (!(key in aggregates)) aggregates[key] = []
    aggregates[key].push(it)
  }
  return aggregates
}
