import { vec2 } from "../utils/vec"
import { angleForLerp, clamp, lerp, mod } from "../utils/math"
import { Token } from "../network/token"
import { rnd } from "../utils/rnd"

let c = 0
const _v2a = vec2(),
  _v2b = vec2()

export const BodyFlags = {
  DEBUG: 2 ** 0,
  REPELLING: 2 ** 1,
  REPELLED: 2 ** 2,
  FOOD: 2 ** 3,
  FOOD_SEEKER: 2 ** 4,
  ORGANISM: 2 ** 5,
}

const MAX_VELOCITY = 0.2
const MAX_VELOCITY_SQ = MAX_VELOCITY ** 2

export class Body {
  constructor(pos, radius, friction = 0, color = "#00ff00") {
    this.id = c++
    this.radius = radius
    this.color = color
    this.pos = pos
    this.vel = vec2()
    this.acc = vec2()
    this.forwards = vec2().fromAngle(rnd.range(0, TAU))
    this.flags = 0
    this.data = {
      clusterGroup: -1,
    }
    this.springs = []
    this.modifiers = []
    this.friction = friction
    this.chemicals = {
      one: 1,
      two: 1,
      three: 1,
      four: 1,
    }
    this.receivedTokens = []
    this.tokens = []
    this.netCycle = 0
    this.sensors = []
  }

  // todo
  // tokens move more slowly (once every N frame or N ms)
  // ie tokens are processed after a delay

  emitToken(chemical, getValue) {
    const value = getValue(this.chemicals[chemical])
    // this.chemicals[chemical] = max(0, this.chemicals[chemical] - value)

    if (value > 0.01) {
      this.receivedTokens.unshift(new Token(chemical, value))
    }
  }

  prepareTokens() {
    this.tokens = this.receivedTokens
    this.receivedTokens = []
  }

  receiveToken(token) {
    this.receivedTokens.unshift(token)
  }

  sendToken(token) {
    const spring = this.springs[this.netCycle]
    if (!spring) return
    const other = spring.bodyA === this ? spring.bodyB : spring.bodyA
    other.receiveToken(token)
    this.netCycle = (this.netCycle + 1) % this.springs.length
  }

  processTokens() {
    let token
    for (let i = this.tokens.length - 1; i >= 0; i--) {
      token = this.tokens[i]
      // todo: here activate token process
      token.quantity *= 0.95

      // this.chemicals[token.chemical] += 0.03 * token.quantity
      if (token.quantity > 0.01) {
        this.sendToken(token)
        // if ($fx.rand() < 0.01) {
        //   this.sendToken(new Token("one", this.chemicals.one))
        //   this.chemicals.one = 0
        // }
      }
      this.tokens.splice(i, 1)
    }
  }

  update(dt) {
    this.sensors.forEach((sensor) => sensor.update(dt))

    this.vel.add(this.acc.mul(dt))
    this.vel.mul(1 - this.friction)
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

    if (this.springs.length === 0) {
      this.forwards.copy(this.vel).normalize()
    } else {
      let other
      _v2b.set(0, 0)
      for (const spring of this.springs) {
        other = spring.bodyA === this ? spring.bodyB : spring.bodyA
        _v2a.copy(other.pos).sub(this.pos)
        _v2b.add(_v2a)
      }
      _v2b.div(-this.springs.length).normalize()
      const At = _v2b.angle()
      const As = this.forwards.angle()
      this.forwards.fromAngle(lerp(As, angleForLerp(As, At), 0.05))
    }
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
