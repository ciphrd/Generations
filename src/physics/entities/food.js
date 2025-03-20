import { Body } from "../body"

export class Food extends Body {
  constructor(pos, onEaten) {
    super(pos, 0.01, "#0000ff")
    this.nutrients = 1
    this.onEaten = onEaten
    this.baseRad = this.radius
  }

  eat(quantity = 0.01) {
    if (this.nutrients < 0) {
      this.onEaten?.(this)
      this.onEaten = null
      return
    }
    this.nutrients -= quantity
    this.radius = max(this.baseRad * this.nutrients, 0)
    this.color = `rgb(0,0,${(max(0, this.nutrients) * 255) | 0})`
  }
}
