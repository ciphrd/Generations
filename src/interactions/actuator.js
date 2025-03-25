import { lerp } from "../utils/math"

export class Actuator {
  constructor(body, world) {
    this.body = body
    this.world = world
    this.frequency = 5
    this.strength = 3
    this.attack = 10
    this.bodyInitialFriction = body.friction
  }

  apply(t, dt) {
    // todo
    // here maybe we don't shift with ID as this gets triggered by signals which
    // naturally propagate through the network
    // maybe we can tweak the network propagation rate instead, not propagate
    // at every tick, right
    const sn = pow(
      abs(cos(t * 0.001 * this.frequency + this.body.id * 0.2)),
      this.attack
    )
    const a = this.strength * sn

    this.body.friction = lerp(this.bodyInitialFriction, 0.1, 1 - a)

    for (const spring of this.body.springs) {
      spring.stiffness = spring.initial.stiffness + a * spring.initial.stiffness
    }
  }
}
