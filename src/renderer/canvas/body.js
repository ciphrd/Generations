import { BodyFlags } from "../../physics/body"

export const chemicalStyle = [
  { size: 0.008, color: "0,255,0" },
  { size: 0.009, color: "255,0,255" },
  { size: 0.01, color: "0,255,255" },
  { size: 0.011, color: "255,0,0" },
]

export function renderBody(ctx, body) {
  // if (selection.is(body)) {
  //   console.log(body)
  //   console.log(body.color.rgba)
  //   console.log(body.color.css())
  // }

  if (body.actions.eat.eated) {
    ctx.fillStyle = `rgba(0,0,255,${0.15})`
    ctx.beginPath()
    ctx.arc(body.pos.x, body.pos.y, 0.02, 0, TAU)
    ctx.fill()
  }
  if (body.actions.eat.eated) {
    ctx.lineWidth = 0.001
    ctx.strokeStyle = "rgb(0,0,255)"
    ctx.beginPath()
    ctx.moveTo(body.pos.x, body.pos.y)
    ctx.lineTo(body.actions.eat.eated.pos.x, body.actions.eat.eated.pos.y)
    ctx.stroke()
  }

  ctx.fillStyle = body.color.css()
  ctx.beginPath()
  ctx.arc(body.pos.x, body.pos.y, body.radius, 0, 2 * PI)
  ctx.fill()

  let style
  ctx.lineWidth = 0.0008
  style = chemicalStyle[0]
  ctx.strokeStyle = `rgba(${style.color},${body.signal})`
  ctx.beginPath()
  ctx.rect(
    body.pos.x - style.size,
    body.pos.y - style.size,
    style.size * 2,
    style.size * 2
  )
  ctx.stroke()
}
