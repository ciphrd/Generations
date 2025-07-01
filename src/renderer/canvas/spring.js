export function renderSpring(ctx, spring) {
  if (spring.temp) return

  ctx.lineWidth = 0.004
  ctx.fillStyle = spring.color.css()
  const cx = (spring.bodyA.pos.x + spring.bodyB.pos.x) / 2
  const cy = (spring.bodyA.pos.y + spring.bodyB.pos.y) / 2
  ctx.beginPath()
  ctx.arc(cx, cy, spring.bodyA.radius, 0, TAU)
  ctx.fill()
}
