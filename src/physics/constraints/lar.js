import { vec2 } from "../../utils/vec"

const _v2 = vec2(),
  _dir = vec2()

export class LAR {
  constructor(body, bodies, settings) {
    this.body = body
    this.bodies = bodies
    this.settings = settings
  }

  apply(dt) {
    const { body, bodies } = this
    const { attr, rep } = this.settings

    let D, F
    for (const target of bodies) {
      if (body === target) continue

      _dir.copy(target.pos).sub(body.pos)
      D = _dir.len()
      _dir.normalize()

      if (D > 0.01 && D < attr.range) {
        F = attr.strength / D
        body.acc.add(_dir.clone().mul(F))
      }
      if (D > 0.001 && D < rep.range) {
        F = rep.strength / D
        body.acc.sub(_dir.mul(-F))
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
