import { BodyFlags } from "../../physics/body"
import { arc } from "./renderer"

export function renderEater(ctx, { eater }) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
  ctx.lineWidth = 0.004
  ctx.beginPath()
  ctx.arc(eater.pos.x, eater.pos.y, eater.radius * 1.3, ...arc(3))
  ctx.stroke()

  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
  ctx.lineWidth = 0.001
  ctx.beginPath()
  ctx.arc(eater.pos.x, eater.pos.y, eater.radius * 1.5, 0, 2 * PI)
  ctx.stroke()
}
