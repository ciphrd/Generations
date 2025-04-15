import { arr } from "../../utils/array"
import { mod } from "../../utils/math"
import { vec2 } from "../../utils/vec"

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
