import { BodyFlags } from "../physics/body"

export class FoodSeeker {
  constructor(body, world) {
    this.body = body
    this.world = world
    this.body.addFlag(BodyFlags.FOOD_SEEKER)
  }

  apply() {}
}
