import { Action } from "./action"

export class FireAction extends Action {
  constructor(body) {
    super(body)
  }

  activate(t, dt, chemicalQuantity, values) {
    if (selection.selected === this.body) {
      console.log("fire !!")
      console.log({ chemicalQuantity, values, signals: [...this.body.signals] })
    }
    if (chemicalQuantity > 0.001) {
      // todo
      // explore: maybe it's not possible to fire more than what's been received
      this.body.sendSignal(values[0], chemicalQuantity * 0.96)
    }
  }

  apply() {}
}
