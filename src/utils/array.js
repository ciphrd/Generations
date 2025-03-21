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
  del(A, el) {
    const idx = A.indexOf(el)
    if (idx < 0) return
    A.splice(idx, 1)
  },
  log(A, get = (v) => v) {
    for (const el of A) {
      console.log(get(el))
    }
  },
}
