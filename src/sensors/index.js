import { SmellSensor } from "./smell"
import { VisionSensor } from "./vision"

export const SensorChemicals = {
  vision: 0,
  smell: 1,
}

export const Sensors = {
  smell: SmellSensor,
  vision: VisionSensor,
  // add an empty sensor for distribution equilibrium, since sensor is picked
  // using 2 bits
  none: null,
  none2: null,
}
export const SensorKeys = Object.keys(Sensors)
