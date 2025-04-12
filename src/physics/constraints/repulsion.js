import { SpacePartition } from "../../opti/hash-partition"
import { vec2 } from "../../utils/vec"
import { BodyFlags } from "../body"

/**
 * Global repulsion.
 * Uses space hash partionning to reduce amount of computations.
 */
export class GlobalRepulsion {
  constructor(world, settings) {
    this.world = world
    this.v2 = vec2()
    this.settings = settings
  }

  apply(t, dt, computeCache) {
    const { radius, strength } = this.settings
    const part = this.world.partition(
      radius,
      BodyFlags.REPELLING | BodyFlags.REPELLED
    )

    let _
    for (const a of part.bodies) {
      if (!a.hasFlag(BodyFlags.REPELLED)) continue
      for (const b of part.neighbours(a)) {
        if (a === b || !b.hasFlag(BodyFlags.REPELLING)) continue
        _ = computeCache.get(a, b)
        if (_.d < radius && _.d > 0.003) {
          a.acc.sub(this.v2.copy(_.dir).mul(strength / _.d2))
        }
      }
    }
  }
}
