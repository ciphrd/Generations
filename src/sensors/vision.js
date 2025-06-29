import { SensorChemicals } from "."
import { BodyFlags } from "../physics/body"
import { vec2 } from "../utils/vec"
import { Sensor } from "./sensor"

const _v2a = vec2(),
  _v2b = vec2()
const N_SAMPLES = 10
const LENGTH = 0.2

export class VisionSensor extends Sensor {
  constructor(body, world) {
    super(body, world, "vision")
    this.length = LENGTH
  }

  update(t, dt) {
    const { body, world, dir } = this
    const part = world.partition(0.01, BodyFlags.FOOD)

    // take N samples along the sensor to check for food
    this.activation = 0
    _v2a.copy(body.pos)
    _v2b.copy(body.forwards).mul(this.length).div(N_SAMPLES)
    for (let i = 0; i < N_SAMPLES; i++) {
      _v2a.add(_v2b)
      if (_v2a.outside()) break
      for (const food of part.posNeighbours(_v2a)) {
        if (_v2a.distSq(food.pos) < food.radius ** 2) {
          this.activation = cos(t * 0.04) * 0.5
          body.receiveSignal(this.activation)
          return
        }
      }
    }
  }
}
