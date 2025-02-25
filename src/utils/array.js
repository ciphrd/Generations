export function rndarr(arr, mut = (x) => x) {
  return arr[floor(mut($fx.rand() * arr.length))]
}

export function delarr(arr, el) {
  const idx = arr.indexOf(el)
  if (idx < 0) return
  arr.splice(idx, 1)
}
