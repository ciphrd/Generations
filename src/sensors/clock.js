import { Sensor } from "./sensor"

export class ClockSensor extends Sensor {
  constructor(body, world) {
    super(body, world)
  }

  update(t) {
    this.body.emitToken(2, () => sin(t * 0.01))
  }
}
