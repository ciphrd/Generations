import { BodyFlags } from "../../physics/body"

export function renderBody(ctx, body) {
  ctx.fillStyle = body.color
  ctx.beginPath()
  ctx.arc(body.pos.x, body.pos.y, body.radius, 0, 2 * PI)
  ctx.fill()
}
