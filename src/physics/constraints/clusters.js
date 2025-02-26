import { SpacePartition } from "../../utils/hash-partition"
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
    this.dir = vec2()
    this.v2 = vec2()
  }

  updateBodies(bodies) {
    this.bodies = bodies.filter((body) => body.data.clusterGroup >= 0)
  }

  apply(dt) {
    const { dir, v2, matrix, nb } = this
    const part = new SpacePartition(this.bodies, sqrt(this.maxRadiusSq))
    let D, rule
    for (const A of this.bodies) {
      const neighbours = part.neighbours(A)
      for (const B of neighbours) {
        if (A === B) continue
        rule = matrix[A.data.clusterGroup + B.data.clusterGroup * nb]
        dir.copy(B.pos).sub(A.pos)
        D = dir.len()
        dir.div(D)
        if (D < rule.rep.range && D > 0.0001) {
          A.acc.sub(v2.copy(dir).mul((0.2 * rule.rep.strength) / D ** 2))
        }
        if (D < rule.attr.range && D > 0.0001) {
          A.acc.add(v2.copy(dir).mul((0.2 * rule.attr.strength) / D ** 2))
        }

        // todo collision
      }
    }
  }
}
