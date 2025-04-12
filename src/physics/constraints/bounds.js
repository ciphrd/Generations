export class SquareBounds {
  constructor(world) {
    this.world = world
  }

  apply() {
    for (const body of this.world.bodies) {
      body.clamp()
    }
  }
}
