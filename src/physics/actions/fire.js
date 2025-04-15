import { Action } from "./action"

export class FireAction extends Action {
  constructor(body) {
    super(body)
  }

  activate(t, dt, chemicalStrength, values) {
    if (chemicalStrength > 0.001) {
      this.body.sendSignal(values[0], chemicalStrength * 0.96)
    }
  }

  apply() {}
}
