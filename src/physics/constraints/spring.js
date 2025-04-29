import { arr } from "../../utils/array"
import { vec2 } from "../../utils/vec"
import { modulator } from "../signals/modulator"

const a2 = arr.new(2)

/**
 * todo.
 * Higher abstraction with Liaison ?
 * contains a spring & wire
 */

export class Spring {
  constructor(bodyA, bodyB, restLength, stiffness, damping, color = "255,0,0") {
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

    this.prevContraction = 0
    this.contraction = 0

    this.prevLength = restLength
    this.length = restLength

    this.color = color

    // for each signal band, there's a modulator controlling the flow
    this.modulators = arr.new(4, () => modulator(bodyA, bodyB))
    this.signals = arr.new(8, 0)
  }

  sendSignal(from, band, value) {
    this.signals[band * 2 + (from === this.bodyA ? 0 : 1)] = value
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
    for (let i = 0; i < 4; i++) {
      this.modulators[i].modulate(
        this.signals[i * 2],
        this.signals[i * 2 + 1],
        a2
      )
      this.bodyA.receiveSignal(i, a2[1], `body:${this.bodyB.id}`)
      this.bodyB.receiveSignal(i, a2[0], `body:${this.bodyA.id}`)

      // if (i === 0) {
      //   console.log([this.signals[0], this.signals[1], ...a2])
      // }
    }
    this.signals.fill(0)
    // console.log([...this.modulators.map((mod) => mod.modulation)])

    // todo: still need that ? not sure
    this.prevContraction = this.contraction
    this.restLength = this.initial.restLength * (1 - this.contraction)
    // todo.
    // the factor of change could be genetically driven here
    this.stiffness = this.initial.stiffness * (1 + abs(this.contraction) * 1.5)
    // same for the contraction back to rest
    this.contraction *= 0.98

    const { bodyA, bodyB, restLength, stiffness, damping, disp } = this
    disp.copy(bodyB.pos).sub(bodyA.pos)
    const D = disp.len()
    if (D < 0.00001) return

    // if (D > 0.1) {
    //   return false
    // }

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
