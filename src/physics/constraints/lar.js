import { SpacePartition } from "../../opti/hash-partition"
import { vec2 } from "../../utils/vec"

const _v2 = vec2(),
  _dir = vec2()

export class LAR {
  constructor(bodies, targets, settings) {
    this.bodies = bodies
    this.targets = targets
    this.settings = settings
    this.maxRad = max(settings.attr.range, settings.rep.range)
    this.v2 = vec2()
  }

  apply(t, dt, computeCache) {
    const { bodies, targets } = this
    const { attr, rep } = this.settings
    const part = new SpacePartition(this.targets, this.maxRad)

    let _, F
    for (const a of this.bodies) {
      for (const b of part.posNeighbours(a.pos)) {
        if (a === b) continue
        _ = computeCache.get(a, b)

        if (_.d > 0.003 && _.d < attr.range) {
          F = min(3, attr.strength / _.d)
          a.acc.add(this.v2.copy(_.dir).mul(F))
        }
        if (_.d > 0.001 && _.d < rep.range) {
          F = rep.strength / _.d
          a.acc.sub(this.v2.copy(_.dir).mul(-F))
        }
      }
    }
  }
}

export function larf(range, strength) {
  return {
    range,
    strength,
  }
}
