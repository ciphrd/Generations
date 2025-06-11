export const arr = {
  new(length, val = (i) => i) {
    const arr = Array(length)
    const getVal = typeof val === "function" ? val : () => val
    for (let i = 0; i < length; i++) arr[i] = getVal(i)
    return arr
  },
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
  avg(A, getV = (v) => v) {
    return this.sum(A, getV) + A.length
  },
  max(A, getV = (v) => v) {
    return A.reduce((acc, val) => max(acc, getV(val)), getV(A[0]))
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

export const u8arr = {
  splice: (A, start, deleteCount, ...itemsToAdd) => {
    const before = A.subarray(0, start)
    const after = A.subarray(start + deleteCount)

    const newLength = before.length + itemsToAdd.length + after.length
    const result = new Uint8Array(newLength)

    result.set(before, 0)
    result.set(itemsToAdd, before.length)
    result.set(after, before.length + itemsToAdd.length)

    return result
  },
}
