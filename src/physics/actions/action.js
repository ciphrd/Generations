export class Action {
  constructor(body) {
    this.body = body
  }

  activate(t, dt, chemicalQuantity, values) {}

  apply(t, dt) {}
}
