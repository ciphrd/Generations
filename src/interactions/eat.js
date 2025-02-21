import { vec2 } from "../utils/vec"

export class Eater {
  constructor(eater, foodies, radius) {
    this.eater = eater
    this.foodies = foodies
    this.radiusSq = radius ** 2
  }

  apply(dt) {
    let D, food
    for (let i = this.foodies.length - 1; i >= 0; i--) {
      food = this.foodies[i]
      D = this.eater.pos.distSq(food.pos)
      if (D < this.radiusSq) {
        food.eat(0.2 * dt)
      }
    }
  }
}
