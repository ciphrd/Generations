import { vec2 } from "../utils/vec"
import { clamp, mod } from "../utils/math"

let c = 0

export const BodyFlags = {
  GLOBAL_REPULSION: 0b1,
  WANDERING: 0b10,
  THIRD: 0b100,
}

const MAX_VELOCITY = 0.5
const MAX_VELOCITY_SQ = MAX_VELOCITY ** 2

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
    let lenSq = this.vel.lenSq()
    if (lenSq > MAX_VELOCITY_SQ) {
      this.vel.mul(MAX_VELOCITY / sqrt(lenSq))
    }
    this.acc.res()
    this.pos.add(this.vel.x * dt, this.vel.y * dt)

    if (this.pos.x < 0) {
      this.pos.x = 1 - mod(this.pos.x, 1)
      this.vel.x *= -1
    } else if (this.pos.x >= 1) {
      this.pos.x = 1 - mod(this.pos.x, 1)
      this.vel.x *= -1
    }

    if (this.pos.y < 0) {
      this.pos.y = 1 - mod(this.pos.y, 1)
      this.vel.y *= -1
    } else if (this.pos.y >= 1) {
      this.pos.y = 1 - mod(this.pos.y, 1)
      this.vel.y *= -1
    }
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
