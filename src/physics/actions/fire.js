import { settings } from "../../settings"
import { clamp } from "../../utils/math"
import { Action } from "./action"

export class FireAction extends Action {
  constructor(body) {
    super(body)
  }

  activate(t, dt, chemicalStrength, values) {
    let strength = values[1]
    if (isNaN(strength)) strength = 0

    // this.body.sendSignal(values[0], chemicalStrength * settings.signals.loss)
    this.body.sendSignal(
      values[0],
      clamp(strength * settings.signals.loss, -1, 1)
    )
  }

  apply() {}
}
