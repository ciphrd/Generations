export class Sensor {
  constructor(body, world) {
    this.body = body
    this.world = world
    this.body.sensors.push(this)
  }
}
