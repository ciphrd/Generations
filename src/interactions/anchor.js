export class Anchor {
  constructor(body, world) {
    this.body = body
    this.world = world
    this.frequency = 5
    this.strength = 0.4
    this.attack = 100
  }

  #modifier = () => {
    const a =
      this.strength *
      pow(abs(sin(this.t * 0.001 * this.frequency)), this.attack)
    this.body.vel.mul(1 - a)
  }

  apply(t, dt) {
    this.t = t
    this.body.modifiers.push(this.#modifier)
  }
}
