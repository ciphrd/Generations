import { BodyFlags } from "../../physics/body"

export function renderEater(ctx, { eater }) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"
  ctx.lineWidth = 0.0015
  ctx.beginPath()
  ctx.arc(eater.pos.x, eater.pos.y, eater.radius * 1.5, 0, 2 * PI)
  ctx.stroke()
}
