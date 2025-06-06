import { twoBodiesId } from "../../utils/cache"
import { SpacePartition } from "../../opti/hash-partition"
import { vec2 } from "../../utils/vec"

const _v2a = vec2()

export class Collisions {
  constructor(world) {
    this.world = world
    this.world.emitter.on("bodies:update", () => {
      this.#update()
    })
    this.#update()
  }

  #update() {
    this.maxRad = this.world.bodies.reduce(
      (acc, val) => max(acc, val.radius),
      0
    )
  }

  apply(t, dt, computeCache) {
    const done = {}
    const part = this.world.partition(this.maxRad * 2)

    let e, s, imp, id, _
    for (const a of this.world.bodies) {
      for (const b of part.neighbours(a)) {
        id = twoBodiesId(a, b)
        if (a === b || done[id]) continue
        _ = computeCache.get(a, b)

        if (_.d < 0.00001) continue
        e = _.d - (a.radius + b.radius)
        if (e < 0) {
          e /= 2
          _v2a.copy(_.dir).mul(0.4 * e)
          a.pos.add(_v2a)
          b.pos.sub(_v2a)

          _v2a.copy(b.vel).sub(a.vel)
          s = _v2a.dot(_.dir)
          if (s < 0) {
            imp = _v2a.copy(_.dir).mul((-(1 + 0.9) * s) / 2)
            a.vel.sub(imp)
            b.vel.add(imp)
          }
        }
        done[id] = true
      }
    }
  }
}
