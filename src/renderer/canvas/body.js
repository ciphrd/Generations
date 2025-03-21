import { BodyFlags } from "../../physics/body"

export function renderBody(ctx, body) {
  ctx.fillStyle = body.color
  ctx.beginPath()
  ctx.arc(body.pos.x, body.pos.y, body.radius, 0, 2 * PI)
  ctx.fill()

  if (body.hasFlag(BodyFlags.DEBUG)) {
    ctx.strokeStyle = "rgba(0, 0, 255, 0.25)"
    ctx.lineWidth = 0.0025
    ctx.beginPath()
    ctx.moveTo(body.pos.x, body.pos.y)
    ctx.lineTo(body.pos.x + body.vel.x * 0.5, body.pos.y + body.vel.y * 0.5)
    ctx.stroke()
  }
}
