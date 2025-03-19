import { SpacePartition } from "../../utils/hash-partition"
import { vec2 } from "../../utils/vec"

export class Clusters {
  constructor(bodies, ruleMatrix, nSpecies, computeCache) {
    this.updateBodies(bodies)
    this.matrix = ruleMatrix
    this.nb = nSpecies
    this.maxRadiusSq = ruleMatrix.reduce(
      (acc, val) => max(acc, max(val.attr.range, val.rep.range)),
      0
    )
    this.v2 = vec2()
    this.cache = computeCache
  }

  updateBodies(bodies) {
    this.bodies = bodies.filter((body) => body.data.clusterGroup >= 0)
  }

  //
  // find why cache is not working
  // git stash pop

  apply(dt) {
    const { v2, matrix, nb } = this
    const part = new SpacePartition(this.bodies, sqrt(this.maxRadiusSq))
    let _, rule
    for (const A of this.bodies) {
      const neighbours = part.neighbours(A)
      for (const B of neighbours) {
        if (A === B) continue
        rule = matrix[A.data.clusterGroup + B.data.clusterGroup * nb]
        _ = this.cache.get(A, B)
        if (_.d > 0.0007) {
          if (_.d < rule.rep.range) {
            A.acc.sub(v2.copy(_.dir).mul((0.5 * rule.rep.strength) / _.d2))
          }
          if (_.d < rule.attr.range) {
            A.acc.add(v2.copy(_.dir).mul((0.5 * rule.attr.strength) / _.d2))
          }
        }
      }
    }
  }
}
