export function rndarr(arr, mut = (x) => x) {
  return arr[floor(mut($fx.rand() * arr.length))]
}

export function delarr(arr, el) {
  const idx = arr.indexOf(el)
  if (idx < 0) return
  arr.splice(idx, 1)
}

export const arr = {
  dedup(A) {
    for (let i = A.length - 1; i >= 0; i--) {
      for (let j = i - 1; j >= 0; j--) {
        if (A[i] === A[j]) {
          A.splice(i, 1)
          continue
        }
      }
    }
    return A
  },
  sum(A, getV = (v) => v) {
    return A.reduce((acc, val) => acc + getV(val), 0)
  },
}
