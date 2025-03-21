import { twoBodiesId } from "../../utils/cache"
import { SpacePartition } from "../../opti/hash-partition"
import { vec2 } from "../../utils/vec"

export class Collisions {
  constructor(bodies) {
    this.update(bodies)
    this.dir = vec2()
  }

  update(bodies) {
    this.bodies = bodies
    this.maxRad = bodies.reduce((acc, val) => max(acc, val.radius), 0)
    this.part = new SpacePartition(this.bodies, this.maxRad)
  }

  apply(t, dt, computeCache) {
    const done = {}
    this.part.update()

    let e, id, _
    for (const a of this.bodies) {
      for (const b of this.part.neighbours(a)) {
        id = twoBodiesId(a, b)
        if (a === b || done[id]) continue
        _ = computeCache.get(a, b)
        if (_.d < 0.0000001) continue
        e = _.d - (a.radius + b.radius)
        if (e < 0) {
          e /= 2
          this.dir.copy(_.dir).mul(e)
          a.pos.add(this.dir)
          b.pos.sub(this.dir)
        }
        done[id] = true
      }
    }
  }
}
