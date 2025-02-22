import { SpacePartition } from "../../utils/hash-partition"
import { vec2 } from "../../utils/vec"
import { BodyFlags } from "../body"

/**
 * Global repulsion.
 * Uses space hash partionning to reduce amount of computations.
 */
export class GlobalRepulsion {
  constructor(bodies, settings) {
    this.updateBodies(bodies)
    this.dir = vec2()
    this.settings = settings
  }

  updateBodies(bodies) {
    this.filtered = bodies.filter((body) =>
      body.hasFlag(BodyFlags.GLOBAL_REPULSION)
    )
  }

  apply(dt) {
    const { radius, strength } = this.settings
    const radSq = radius ** 2
    const part = new SpacePartition(this.filtered, radius)

    let D
    for (const A of this.filtered) {
      const neighbours = part.neighbours(A)
      for (const B of neighbours) {
        if (A === B) continue
        this.dir.copy(B.pos).sub(A.pos)
        D = this.dir.lenSq()
        if (D < radSq && D > 0.00001) {
          this.dir.div(sqrt(D))
          A.acc.sub(this.dir.mul(strength / D))
        }
      }
    }
  }
}
