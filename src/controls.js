import { emitter } from "./utils/emitter"
import { vec2 } from "./utils/vec"

class ControlsClass {
  constructor() {
    this.autoTracking = false
    this.txy = vec2(0, 0)
    this.scale = 1
    this.emitter = emitter()
  }

  setTracking(enabled) {
    this.autoTracking = enabled
    this.emitUpdated()
  }

  emitUpdated() {
    this.emitter.emit("updated")
  }

  translate(tx, ty) {
    // todo: compute here the actual tx value needed for best ux
    this.txy.add(tx, ty)
    this.emitUpdated()
  }

  tweakScale(ds) {
    // todo compute scale value needed for best ux
    this.scale += ds
    this.emitUpdated()
  }

  get() {
    return {
      autoTracking: this.autoTracking,
      transation: this.txy,
      scale: this.scale,
      instance: this,
    }
  }
}

export const Controls = new ControlsClass()
