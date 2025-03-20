import { vec2 } from "../utils/vec"

export class Eater {
  constructor(body, world) {
    this.eater = body
    this.world = world
  }

  apply(t, dt) {
    let D, food
    for (let i = this.world.food.length - 1; i >= 0; i--) {
      food = this.world.food[i]
      D = this.eater.pos.dist(food.pos)
      if (D < this.eater.radius + food.radius) {
        food.eat(0.2 * dt)
      }
    }
  }
}
