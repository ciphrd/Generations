import { vec2 } from "./utils/vec"

class ControlsClass {
  constructor() {
    this.txy = vec2(0, 0)
    this.scale = 3
  }
}

export const Controls = new ControlsClass()
