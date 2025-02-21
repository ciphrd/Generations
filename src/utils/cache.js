// deterministric ID for a pair of bodies, ordered by id
export function twoBodiesId(bodyA, bodyB) {
  const idB = bodyB.id
  const idA = bodyA.id
  return `${max(idA, idB)}-${min(idA, idB)}`
}

export class Cache {
  constructor() {
    this.cache = {}
  }

  get(key, generate) {
    if (key in this.cache) return this.cache[key]
    const val = generate()
    this.cache[key] = val
    return val
  }

  reset() {
    this.cache = {}
  }
}
