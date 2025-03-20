export class Actuator {
  constructor(body, world) {
    this.body = body
    this.world = world
    this.frequency = 5
    this.strength = 3
    this.attack = 10
  }

  apply(t, dt) {
    const a =
      this.strength * pow(abs(cos(t * 0.001 * this.frequency)), this.attack)
    for (const spring of this.body.springs) {
      spring.stiffness = spring.initial.stiffness + a * spring.initial.stiffness
    }
  }
}
