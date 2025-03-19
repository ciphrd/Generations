export class SquareBounds {
  constructor(bodies) {
    this.bodies = bodies
  }

  apply() {
    for (const body of this.bodies) {
      body.clamp()
    }
  }
}
