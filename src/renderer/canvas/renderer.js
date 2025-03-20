import { renderBody } from "./body"
import { renderEater } from "./eater"
import { renderSpring } from "./spring"

const W = 800
const H = 800

const renderers = {
  Body: renderBody,
  Food: renderBody,
  Spring: renderSpring,
  Eater: renderEater,
}

export class CanvasRenderer {
  constructor(entities) {
    this.entities = entities
    this.cvs = document.createElement("canvas")
    this.cvs.width = W * devicePixelRatio
    this.cvs.height = H * devicePixelRatio
    this.cvs.style.width = W + "px"
    this.cvs.style.height = H + "px"
    this.ctx = this.cvs.getContext("2d")
    this.ctx.scale(this.cvs.width, this.cvs.height)
    this.ctx.translate(0.5, 0.5)
    this.ctx.scale(1, -1)
    this.ctx.translate(-0.5, -0.5)
    this.texelSize = 1 / this.cvs.width
    document.body.appendChild(this.cvs)
  }
  render() {
    this.ctx.fillStyle = "black"
    this.ctx.fillRect(0, 0, 1, 1)

    let renderer
    for (const group of this.entities) {
      for (const ent of group) {
        renderer = renderers[ent.constructor.name]
        if (!renderer) continue
        renderer(this.ctx, ent)
      }
    }
  }
}
