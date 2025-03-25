import { chemicalStyle } from "./body"

const SensorRendererMap = {
  VisionSensor: renderVisionSensor,
  SmellSensor: renderSmellSensor,
}

export function renderSensors(ctx, sensors) {
  for (const sensor of sensors) {
    SensorRendererMap[sensor.constructor.name](ctx, sensor)
  }
}

function renderVisionSensor(ctx, sensor) {
  ctx.save()
  ctx.lineWidth = 0.001
  ctx.strokeStyle = `rgba(${chemicalStyle.one.color},0.7)`
  ctx.translate(sensor.body.pos.x, sensor.body.pos.y)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(
    sensor.body.forwards.x * sensor.length,
    sensor.body.forwards.y * sensor.length
  )
  ctx.stroke()
  ctx.restore()
}

function renderSmellSensor(ctx, sensor) {
  ctx.save()
  ctx.fillStyle = `rgba(${chemicalStyle.two.color},0.1)`
  ctx.translate(sensor.body.pos.x, sensor.body.pos.y)
  ctx.beginPath()
  ctx.arc(0, 0, sensor.dist, 0, TAU)
  ctx.fill()
  ctx.restore()
}
