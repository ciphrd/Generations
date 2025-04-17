export class Sensor {
  constructor(body, world, name) {
    this.name = name
    this.body = body
    this.world = world
    this.body.sensors.push(this)
    this.activation = 0
  }
}
