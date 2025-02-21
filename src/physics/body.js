import { vec2 } from "../utils/vec"
import { mod } from "../utils/math"

let c = 0

export const BodyFlags = {
  GLOBAL_REPULSION: 0b1,
  SECOND: 0b10,
  THIRD: 0b100,
}

export class Body {
  constructor(pos, color = "#00ff00") {
    this.id = c++
    this.color = color
    this.pos = pos
    this.vel = vec2()
    this.acc = vec2()
    this.flags = 0
  }

  update(dt) {
    this.vel.add(this.acc.mul(dt))
    this.acc.res()
    this.pos.add(this.vel.x * dt, this.vel.y * dt)
    this.pos.apply((x) => mod(x, 1))
  }

  addFlag(flag) {
    this.flags |= flag
  }

  removeFlag(flag) {
    this.flags -= this.flags & flag
  }

  hasFlag(flag) {
    return !!(this.flags & flag)
  }
}

export function body(pos, col) {
  return new Body(pos, col)
}
