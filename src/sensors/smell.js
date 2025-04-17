import { SensorChemicals } from "."
import { BodyFlags } from "../physics/body"
import { vec2 } from "../utils/vec"
import { Sensor } from "./sensor"

const _v2a = vec2()
const DIST = 0.051

export class SmellSensor extends Sensor {
  constructor(body, world) {
    super(body, world, "smell")
    this.dist = DIST
    this.distSq = DIST ** 2
  }

  update() {
    const { body, world, dist } = this
    const part = world.partition(DIST, BodyFlags.FOOD)

    this.activation = 0
    for (const food of part.posNeighbours(body.pos)) {
      if (body.pos.distSq(food.pos) < (this.dist + food.radius) ** 2) {
        this.activation = 1
        body.receiveSignal(SensorChemicals.smell, 1)
        break
      }
    }
  }
}
