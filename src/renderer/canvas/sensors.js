import { chemicalStyle } from "./body"

const SensorRendererMap = {
  VisionSensor: renderVisionSensor,
  SmellSensor: renderSmellSensor,
  ClockSensor: renderClockSensor,
}

export function renderSensors(ctx, sensors) {
  for (const sensor of sensors) {
    SensorRendererMap[sensor.constructor.name](ctx, sensor)
  }
}

function renderVisionSensor(ctx, sensor) {
  ctx.save()
  ctx.lineWidth = 0.001
  ctx.strokeStyle = `rgba(${chemicalStyle[0].color},0.7)`
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
  ctx.fillStyle = `rgba(${chemicalStyle[1].color},0.1)`
  ctx.translate(sensor.body.pos.x, sensor.body.pos.y)
  ctx.beginPath()
  ctx.arc(0, 0, sensor.dist, 0, TAU)
  ctx.fill()
  ctx.restore()
}

function renderClockSensor(ctx, sensor) {
  ctx.save()
  ctx.strokeStyle = `rgba(${chemicalStyle[2].color}, 1)`
  ctx.lineWidth = 0.001
  ctx.translate(sensor.body.pos.x, sensor.body.pos.y)
  ctx.beginPath()
  ctx.arc(0, 0, sensor.body.radius * 1.2, 0, TAU)
  ctx.stroke()
  ctx.restore()
}
