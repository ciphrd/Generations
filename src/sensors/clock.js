import { lerp } from "../utils/math"
import { Sensor } from "./sensor"

export class ClockSensor extends Sensor {
  constructor(body, world, value) {
    super(body, world)
    this.frequency = lerp(0.2, 3, value / 255)
  }

  update(t) {
    this.body.receiveSignal(2, sin(t * 0.01 * this.frequency) * 0.5 + 0.5)
  }
}
