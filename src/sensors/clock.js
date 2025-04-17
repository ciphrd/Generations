import { SensorChemicals } from "."
import { lerp } from "../utils/math"
import { Sensor } from "./sensor"

export class ClockSensor extends Sensor {
  constructor(body, world, value) {
    super(body, world, "clock")
    this.frequency = lerp(0.2, 3, ((value >> 8) & 0xff) / 0xff)
    this.amplitude = lerp(-0.5, 0.5, (value & 0xff) / 0xff)
  }

  update(t) {
    this.activation = sin(t * 0.01 * this.frequency) * this.amplitude + 0.5
    this.body.receiveSignal(SensorChemicals.clock, this.activation)
  }
}
