import { mod } from "../../utils/math"
import { vec2 } from "../../utils/vec"

export class Spring {
  constructor(bodyA, bodyB, restLength, stiffness, damping) {
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
    // this.bodyB.springs.push(this)

    this.prevContraction = 0
    this.contraction = 0
  }

  contract(strength) {
    this.contraction = mod(this.contraction + strength * 0.3, 1)
  }

  apply(t, dt) {
    if (this.bodyA.id === 0) {
      // console.log(this.contraction)
    }

    this.stiffness = this.initial.stiffness * (1 + this.contraction * 10)
    this.prevContraction = this.contraction
    this.contraction *= 0.9
    // this.contraction *= 0.8

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
  }
}
