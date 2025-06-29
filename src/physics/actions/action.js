export class Action {
  constructor(body) {
    this.body = body
  }

  activate(t, dt, energy) {}

  apply(t, dt) {}
}
