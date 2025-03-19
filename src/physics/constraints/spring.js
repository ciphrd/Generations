import { delarr } from "../../utils/array"
import { vec2 } from "../../utils/vec"

export class Spring {
  constructor(bodyA, bodyB, restLength, stiffness, damping) {
    this.bodyA = bodyA
    this.bodyB = bodyB
    this.restLength = restLength
    this.stiffness = stiffness
    this.damping = damping
    this.disp = vec2()
  }

  apply(dt) {
    const { bodyA, bodyB, restLength, stiffness, damping, disp } = this
    disp.copy(bodyB.pos).sub(bodyA.pos)
    const D = disp.len()
    if (D < 0.00001) return

    // if (D > 0.15) {
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
