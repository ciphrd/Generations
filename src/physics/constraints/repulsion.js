import { SpacePartition } from "../../utils/hash-partition"
import { vec2 } from "../../utils/vec"
import { BodyFlags } from "../body"

/**
 * Global repulsion.
 * Uses space hash partionning to reduce amount of computations.
 */
export class GlobalRepulsion {
  constructor(bodies, settings, computeCache) {
    this.updateBodies(bodies)
    this.v2 = vec2()
    this.settings = settings
    this.cache = computeCache
  }

  updateBodies(bodies) {
    this.filtered = bodies.filter((body) =>
      body.hasFlag(BodyFlags.REPELLING | BodyFlags.REPELLED)
    )
  }

  apply(dt) {
    const { radius, strength } = this.settings
    const radSq = radius ** 2
    const part = new SpacePartition(this.filtered, radius)

    let _
    for (const A of this.filtered) {
      if (!A.hasFlag(BodyFlags.REPELLED)) continue
      const neighbours = part.neighbours(A)
      for (const B of neighbours) {
        if (A === B || !B.hasFlag(BodyFlags.REPELLING)) continue
        _ = this.cache.get(A, B)
        if (_.d < radius && _.d > 0.003) {
          A.acc.sub(this.v2.copy(_.dir).mul(strength / _.d2))
        }
      }
    }
  }
}
