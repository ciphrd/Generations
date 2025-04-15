export function renderSpring(ctx, spring) {
  ctx.lineWidth = 0.004
  ctx.strokeStyle = `rgba(${spring.color},0.4)`
  ctx.beginPath()
  ctx.moveTo(spring.bodyA.pos.x, spring.bodyA.pos.y)
  ctx.lineTo(spring.bodyB.pos.x, spring.bodyB.pos.y)
  ctx.stroke()
}
