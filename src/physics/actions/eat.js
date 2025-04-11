import { BodyFlags } from "../body"
import { Action } from "./action"

const EAT_DIST = 0.04

export class EatAction extends Action {
  constructor(body) {
    super(body)
    this.eated = null
    this.eating = null
  }

  /**
   * todo!
   * this whole thing is bugged, implement better !
   */

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
      const amount = 0.1 * dt
      this.eating.eat(amount)
      this.body.energy += amount * 15
      if (this.eating.radius === 0) this.eating = null
    }
    this.eated = this.eating
    this.eating = null
  }
}
