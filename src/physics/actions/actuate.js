import { clamp, clamp01, lerp, sign } from "../../utils/math"
import { Action } from "./action"

// todo as general simulation parameter
const MAX_STRENGTH = 1.0

export class ActuateAction extends Action {
  constructor(body) {
    super(body)
    this.strength = this.prevStrength = 0
    this.initial = {
      friction: body.friction,
    }
    this.activation = -Infinity

    this.value = 0
    this.prevValue = 0
  }

  activate(t, dt, energy) {
    this.activation = t
    energy = clamp(energy, -1, 1)

    for (const spring of this.body.springs) {
      spring.contraction = lerp(spring.contraction, energy, 1)
    }

    this.prevValue = this.value
    this.value = energy
  }

  apply(t, dt) {}
}
