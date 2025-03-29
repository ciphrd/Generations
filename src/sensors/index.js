import { ClockSensor } from "./clock"
import { SmellSensor } from "./smell"
import { VisionSensor } from "./vision"

export const Sensors = {
  clock: ClockSensor,
  smell: SmellSensor,
  vision: VisionSensor,
  // add an empty sensor for distribution equilibrium, since sensor is picked
  // using 2 bits
  none: null,
}
export const SensorKeys = Object.keys(Sensors)
