import { vec2 } from "../utils/vec"

/**
 * This Cache handles interactions between bodies and stores expensive
 * computations such as direction & distance to fasten N^2 interaction
 * computations.
 */
export class ComputeCache {
  constructor(bodies) {
    this.bodies = bodies
    this.sq = this.bodies.length ** 2
    this.cache = [...Array(this.sq * 2)].map(() => ({
      computed: false,
      dir: vec2(),
      d: 0,
      d2: 0,
    }))
    this.i = 0
  }

  prepare() {
    this.cache.forEach((slot) => (slot.computed = false))
    this.i = 0
  }

  #idx(a, b) {
    return (a.id > b.id ? this.sq : 0) + this.bodies.length * a.id + b.id
  }

  get(a, b, second = false) {
    const idx = this.#idx(a, b)
    const slot = this.cache[idx]
    if (slot.computed && second) return slot

    if (a.id > b.id) {
      const other = this.get(b, a, true)
      slot.dir.set(other.dir.x * -1, other.dir.y * -1)
      slot.d = other.d
      slot.d2 = other.d2
    } else {
      slot.dir.copy(b.pos).sub(a.pos)
      slot.d2 = slot.dir.lenSq()
      slot.d = sqrt(slot.d2)
      slot.dir.div(slot.d)
    }

    slot.computed = true
    return slot
  }
}
