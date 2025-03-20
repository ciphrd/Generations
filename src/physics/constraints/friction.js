export class Friction {
  constructor(body, friction) {
    this.body = body
    this.invFriction = 1.0 - friction
  }
  apply() {
    this.body.vel.mul(this.invFriction)
  }
}
