import { twoBodiesId } from "../utils/cache"
import { SpacePartition } from "../utils/hash-partition"
import { vec2 } from "../utils/vec"

export class Collisions {
  constructor(bodies, computeCache) {
    this.update(bodies)
    this.dir = vec2()
    this.cache = computeCache
  }

  update(bodies) {
    this.bodies = bodies
    this.maxRad = bodies.reduce((acc, val) => max(acc, val.radius), 0)
  }

  apply() {
    const part = new SpacePartition(this.bodies, this.maxRad)
    const done = {}

    let e, id, _
    for (const A of this.bodies) {
      for (const B of part.neighbours(A)) {
        id = twoBodiesId(A, B)
        if (A === B || done[id]) continue
        _ = this.cache.get(A, B)
        if (_.d < 0.0000001) debugger
        e = _.d - (A.radius + B.radius)
        if (e < 0) {
          e /= 2
          this.dir.copy(_.dir).mul(e)
          A.pos.add(this.dir)
          B.pos.sub(this.dir)
        }
        done[id] = true
      }
    }
  }
}
