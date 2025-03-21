import { SpacePartition } from "../../opti/hash-partition"
import { vec2 } from "../../utils/vec"

export class Clusters {
  constructor(bodies, ruleMatrix, nSpecies) {
    this.updateBodies(bodies)
    this.matrix = ruleMatrix
    this.nb = nSpecies
    this.maxRadiusSq = ruleMatrix.reduce(
      (acc, val) => max(acc, max(val.attr.range, val.rep.range)),
      0
    )
    this.v2 = vec2()
    this.part = new SpacePartition(this.bodies, sqrt(this.maxRadiusSq))
  }

  updateBodies(bodies) {
    this.bodies = bodies.filter((body) => body.data.clusterGroup >= 0)
  }

  //
  // find why cache is not working
  // git stash pop

  apply(t, dt, computeCache) {
    const { v2, matrix, nb } = this
    this.part.update()
    let _, rule
    for (const a of this.bodies) {
      const neighbours = this.part.neighbours(a)
      for (const b of neighbours) {
        if (a === b) continue
        rule = matrix[a.data.clusterGroup + b.data.clusterGroup * nb]
        _ = computeCache.get(a, b)
        if (_.d > 0.0007) {
          if (_.d < rule.rep.range) {
            a.acc.sub(v2.copy(_.dir).mul((0.5 * rule.rep.strength) / _.d2))
          }
          if (_.d < rule.attr.range) {
            a.acc.add(v2.copy(_.dir).mul((0.5 * rule.attr.strength) / _.d2))
          }
        }
      }
    }
  }
}
