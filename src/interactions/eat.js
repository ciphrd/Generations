import { vec2 } from "../utils/vec"

export class Eater {
  constructor(eater, foodies) {
    this.eater = eater
    this.foodies = foodies
    this.radiusSq = eater.radius ** 2
  }

  apply(dt) {
    let D, food
    for (let i = this.foodies.length - 1; i >= 0; i--) {
      food = this.foodies[i]
      D = this.eater.pos.dist(food.pos)
      if (D < this.eater.radius + food.radius) {
        food.eat(0.2 * dt)
      }
    }
  }
}
