import { isMobileDevice } from "./utils/device"
import { vec2 } from "./utils/vec"

const envWidth = isMobileDevice() ? 800 : 1600

export const Globals = {
  res: vec2(0, 0),
  deviceRes: vec2(0, 0),
  envRes: vec2(envWidth, envWidth),
}
