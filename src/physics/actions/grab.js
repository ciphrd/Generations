import { clamp, clamp01, lerp } from "../../utils/math"
import { Action } from "./action"

export class GrabAction extends Action {
  constructor(body) {
    super(body)
    this.strength = 0
  }

  activate(t, dt, energy) {
    this.strength = clamp(energy, 0, 0.8)
  }

  apply(t, dt) {
    this.strength *= 0.97
    if (this.strength < 0.00001) return
    this.body.friction = lerp(this.body.initial.friction, this.strength, 0.5)
  }
}
