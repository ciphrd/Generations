import { emitter } from "../utils/emitter"

export class Ticker {
  constructor(dt, stats) {
    this.dt = dt / 1000
    this.time = 0
    this.lastTime = 0
    this.emitter = emitter()
    this.running = false
  }

  tick = () => {
    this.lastTime = this.time
    this.time = this.lastTime + this.dt * 1000
    this.emitter.emit("tick")
  }

  loop = () => {
    if (!this.running) return
    this.tick()
    requestAnimationFrame(this.loop)
  }

  start() {
    this.running = true
    this.emitter.emit("start/stop")
    this.loop()
  }

  stop() {
    this.running = false
    this.emitter.emit("start/stop")
  }
}
