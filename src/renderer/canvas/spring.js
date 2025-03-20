export function renderSpring(ctx, spring) {
  ctx.lineWidth = 0.003
  ctx.strokeStyle = "rgba(255,0,0,0.6)"
  ctx.beginPath()
  ctx.moveTo(spring.bodyA.pos.x, spring.bodyA.pos.y)
  ctx.lineTo(spring.bodyB.pos.x, spring.bodyB.pos.y)
  ctx.stroke()
}
