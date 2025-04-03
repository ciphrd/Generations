import { Action } from "./action"

export class FireAction extends Action {
  constructor(body) {
    super(body)
  }

  activate(dt, chemicalQuantity, values) {
    if (values[1] > 0) {
      // todo
      // explore: maybe it's not possible to fire more than what's been received
      this.body.sendSignal(values[0], chemicalQuantity * 0.96)
    }
  }

  apply() {}
}
