import { arr } from "../utils/array"
import { mod } from "../utils/math"
import { Graph } from "./graph"

export class StackGraph extends Graph {
  drawData() {
    const def = this.sampler.def,
      N = def.length,
      I = mod(this.idx - 1, this.cvs.width),
      m = arr.sum(def, (v) => v.max)

    if (I === 0) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
      this.ctx.fillRect(0, 0, this.cvs.width, this.cvs.height)
    }

    let stack = 0,
      v
    this.ctx.lineWidth = this.texelSize
    for (let s = 0; s < N; s++) {
      this.ctx.fillStyle = def[s].color
      v = this.samples[s][I]
      this.ctx.fillRect(
        I / this.cvs.width,
        stack / m,
        1 / this.cvs.width,
        v / m
      )
      stack += v
    }
  }
}
