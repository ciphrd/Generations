export function renderSpring(ctx, spring) {
  ctx.lineWidth = 0.002
  ctx.strokeStyle = "rgba(255,0,0,0.8)"
  ctx.beginPath()
  ctx.moveTo(spring.bodyA.pos.x, spring.bodyA.pos.y)
  ctx.lineTo(spring.bodyB.pos.x, spring.bodyB.pos.y)
  ctx.stroke()
}
