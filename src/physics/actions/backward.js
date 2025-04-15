import { Action } from "./action"

// todo as general simulation parameter
const MAX_STRENGTH = 1.0

export class BackwardAction extends Action {
  constructor(body) {
    super(body)
    this.strength = 0
  }

  activate(t, dt, chemicalQuantity, values) {
    this.strength = values[0] * 2
  }

  apply(t, dt) {
    this.strength *= 0.97
    if (this.strength < 0.00001) return
    this.body.acc.sub(
      this.body.forwards.x * this.strength,
      this.body.forwards.y * this.strength
    )
  }
}
