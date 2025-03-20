import { BodyFlags } from "./body"

export class World {
  constructor(bodies = []) {
    this.setBodies(bodies)
  }

  setBodies(bodies = []) {
    this.bodies = bodies
    this.food = bodies.filter((body) => body.hasFlag(BodyFlags.FOOD))
  }
}
