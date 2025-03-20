import { vec2 } from "../../utils/vec"

const mid = vec2()
const dir = vec2()

export class Alignement {
  constructor(body, targets) {
    this.body = body
    this.targets = targets
  }
  apply(t, dt) {
    const { body, targets } = this
    mid.copy(targets[0].pos)
    for (let i = 1; i < targets.length; i++) {
      mid.add(targets[i].pos)
    }
    mid.div(targets.length)
    dir.copy(mid).sub(body.pos)
    const D = dir.len()
    body.acc.add(dir.mul(D))
  }
}
