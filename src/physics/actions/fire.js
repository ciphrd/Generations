import { settings } from "../../settings"
import { clamp } from "../../utils/math"
import { Action } from "./action"

export class FireAction extends Action {
  constructor(body) {
    super(body)
  }

  activate(t, dt, energy) {
    if (isNaN(energy)) energy = 0
    this.body.sendSignal(clamp(energy * settings.signals.loss, -1, 1))
  }

  apply() {}
}
