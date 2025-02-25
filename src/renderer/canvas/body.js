import { BodyFlags } from "../../physics/body"

export function renderBody(ctx, body) {
  ctx.fillStyle = body.color
  ctx.beginPath()
  const rad = body.hasFlag(BodyFlags.WANDERING) ? 0.002 : 0.005
  ctx.arc(body.pos.x, body.pos.y, rad, 0, 2 * PI)
  ctx.fill()
}
