import { settings } from "../../settings"
import { Body, BodyFlags } from "../body"

export class Food extends Body {
  constructor(world, pos, onEaten) {
    super(
      world,
      pos,
      settings.food.default.radius,
      0.08,
      settings.food.default.color.clone()
    )
    this.nutrients = 1
    this.onEaten = onEaten
    this.baseRad = this.radius
    this.addFlag(BodyFlags.FOOD | BodyFlags.BINDABLE)
  }

  eat(quantity = 0.01) {
    if (this.nutrients < 0) {
      this.onEaten?.(this)
      this.onEaten = null
      return false
    }
    this.nutrients -= quantity
    this.radius = max(this.baseRad * this.nutrients, 0)
    this.color.a = (max(0, this.nutrients) * 255) | 0
    return true
  }
}
