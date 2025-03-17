import { twoBodiesId } from "../utils/cache"
import { SpacePartition } from "../utils/hash-partition"
import { vec2 } from "../utils/vec"

export class Collisions {
  constructor(bodies) {
    this.update(bodies)
    this.dir = vec2()
  }

  update(bodies) {
    this.bodies = bodies
    this.maxRad = bodies.reduce((acc, val) => max(acc, val.radius), 0)
  }

  apply() {
    const part = new SpacePartition(this.bodies, this.maxRad)
    const done = {}

    let d, e, id
    for (const A of this.bodies) {
      for (const B of part.neighbours(A)) {
        id = twoBodiesId(A, B)
        if (A === B || done[id]) continue
        this.dir.copy(B.pos).sub(A.pos)
        d = this.dir.len()
        if (d < 0.0000001) debugger
        e = d - (A.radius + B.radius)
        if (e < 0) {
          e /= 2
          this.dir.mul(e / d)
          A.pos.add(this.dir)
          B.pos.sub(this.dir)
          A.clamp()
          B.clamp()
        }
        done[id] = true
      }
    }
  }
}
