export class Action {
  constructor(body) {
    this.body = body
  }

  activate(dt, chemicalQuantity, values) {}

  apply(t, dt) {}
}
