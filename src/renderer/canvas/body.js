export function renderBody(ctx, body) {
  ctx.fillStyle = body.color
  ctx.beginPath()
  ctx.arc(body.pos.x, body.pos.y, 0.005, 0, 2 * PI)
  ctx.fill()
}
