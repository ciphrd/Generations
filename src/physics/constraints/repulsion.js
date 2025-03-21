import { SpacePartition } from "../../opti/hash-partition"
import { vec2 } from "../../utils/vec"
import { BodyFlags } from "../body"

/**
 * Global repulsion.
 * Uses space hash partionning to reduce amount of computations.
 */
export class GlobalRepulsion {
  constructor(bodies, settings) {
    this.v2 = vec2()
    this.settings = settings
    this.updateBodies(bodies)
  }

  updateBodies(bodies) {
    this.filtered = bodies.filter((body) =>
      body.hasFlag(BodyFlags.REPELLING | BodyFlags.REPELLED)
    )
    this.part = new SpacePartition(this.filtered, this.settings.radius)
  }

  apply(t, dt, computeCache) {
    const { radius, strength } = this.settings
    this.part.update()

    let _
    for (const a of this.filtered) {
      if (!a.hasFlag(BodyFlags.REPELLED)) continue
      for (const b of this.part.neighbours(a)) {
        if (a === b || !b.hasFlag(BodyFlags.REPELLING)) continue
        _ = computeCache.get(a, b)
        if (_.d < radius && _.d > 0.003) {
          a.acc.sub(this.v2.copy(_.dir).mul(strength / _.d2))
        }
      }
    }
  }
}
