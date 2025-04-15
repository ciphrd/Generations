import { BodyFlags } from "../body"
import { Action } from "./action"

const EAT_DIST = 0.02

export class EatAction extends Action {
  constructor(body) {
    super(body)
    this.eated = null
    this.eating = null
  }

  activate(t, dt, chemicalQuantity, values) {
    const part = this.body.world.partition(EAT_DIST, BodyFlags.FOOD)
    let lowD = Infinity,
      d,
      closest
    for (const food of part.posNeighbours(this.body.pos)) {
      d = food.pos.dist(this.body.pos)
      if (d - food.radius < EAT_DIST && d < lowD) {
        closest = food
        lowD = d
      }
    }
    if (closest) this.eating = closest
  }

  apply(t, dt) {
    if (this.eating) {
      const amount = 0.06 * dt
      this.eating.eat(amount)
      this.body.energy += amount * 10
    }
    this.eated = this.eating
    this.eating = null
  }
}
