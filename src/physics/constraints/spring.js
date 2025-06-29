import { Params } from "../../parametric-space"
import { arr } from "../../utils/array"
import { vec2 } from "../../utils/vec"
import { Entity } from "../entity"
import { modulator } from "../signals/modulator"

const a2 = arr.new(2)

export const SpringFlags = {
  BIND: 2 ** 0,
}

/**
 * todo.
 * Higher abstraction with Liaison ?
 * contains a spring & wire
 */

export class Spring extends Entity {
  constructor(
    bodyA,
    bodyB,
    restLength,
    stiffness,
    damping,
    color = Params.cellsDefaultColor.clone(),
    flags = 0
  ) {
    super()
    this.flags = flags
    this.bodyA = bodyA
    this.bodyB = bodyB
    this.initial = {
      restLength,
      stiffness,
      damping,
    }
    this.restLength = restLength
    this.stiffness = stiffness
    this.damping = damping
    this.disp = vec2()
    this.bodyA.springs.push(this)
    this.bodyB.springs.push(this)

    this.contraction = 0

    this.prevLength = restLength
    this.length = restLength

    this.color = color

    // for each signal band, there's a modulator controlling the flow
    this.modulator = modulator(bodyA, bodyB)
    this.signal = arr.new(2, 0)
  }

  sendSignal(from, value) {
    this.signal[from === this.bodyA ? 0 : 1] = value
  }

  contract(strength) {
    this.contraction = min(this.contraction + strength, 1)
  }

  expand(strength) {
    this.contraction = max(this.contraction - strength, -1)
  }

  other(body) {
    return this.bodyA === body ? this.bodyB : this.bodyA
  }

  apply(t, dt) {
    // process the signals
    this.modulator.modulate(this.signal[0], this.signal[1], a2)
    this.bodyA.receiveSignal(a2[1], `body:${this.bodyB.id}`)
    this.bodyB.receiveSignal(a2[0], `body:${this.bodyA.id}`)
    this.signal.fill(0)

    this.restLength = this.initial.restLength * (1 - this.contraction)
    this.stiffness = this.initial.stiffness * (1 + abs(this.contraction) * 1.5)
    this.contraction *= 0.98

    const { bodyA, bodyB, restLength, stiffness, damping, disp } = this
    disp.copy(bodyB.pos).sub(bodyA.pos)
    const D = disp.len()
    if (D < 0.00001) return

    const dir = disp.div(D)
    const force = -stiffness * (D - restLength)

    const relv = vec2(bodyB.vel).sub(bodyA.vel)
    const dampingForce = -damping * (relv.x * dir.x + relv.y * dir.y)

    const totalForce = force + dampingForce

    const F = dir.mul(totalForce)
    bodyA.acc.sub(F)
    bodyB.acc.add(F)

    this.prevLength = this.length
    this.length = D
  }

  delete() {
    arr.del(this.bodyA.springs, this)
    arr.del(this.bodyB.springs, this)
  }
}
