import { vec2 } from "../utils/vec"
import { clamp, mod } from "../utils/math"

let c = 0

export const BodyFlags = {
  GLOBAL_REPULSION: 0b1,
  REPELLING: 0b10,
  REPELLED: 0b100,
  WANDERING: 0b1000,
  FOOD: 0b10000,
  FOOD_SEEKER: 0b100000,
  DEBUG: 0b1000000,
}

const MAX_VELOCITY = 0.2
const MAX_VELOCITY_SQ = MAX_VELOCITY ** 2

export class Body {
  constructor(pos, radius, color = "#00ff00") {
    this.id = c++
    this.radius = radius
    this.color = color
    this.pos = pos
    this.vel = vec2()
    this.acc = vec2()
    this.flags = 0
    this.data = {
      clusterGroup: -1,
    }
    this.springs = []
    this.modifiers = []
  }

  update(dt) {
    this.vel.add(this.acc.mul(dt))
    let lenSq = this.vel.lenSq()
    if (lenSq > MAX_VELOCITY_SQ) {
      this.vel.mul(MAX_VELOCITY / sqrt(lenSq))
    }
    if (this.modifiers.length > 0) {
      this.modifiers.forEach((mod) => mod(this))
      this.modifiers.length = 0
    }
    this.acc.res()
    this.pos.add(this.vel.x * dt, this.vel.y * dt)
    this.clamp()
  }

  clamp() {
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

export function body(pos, rad, col) {
  return new Body(pos, rad, col)
}
