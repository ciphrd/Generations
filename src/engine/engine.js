import { Controls } from "../controls"
import { emitter } from "../utils/emitter"

export class Engine {
  constructor({ world, solver, selection, ticker, renderer }) {
    this.world = world
    this.solver = solver
    this.selection = selection
    this.renderer = renderer
    this.ticker = ticker
    this.controls = Controls

    this.emitter = emitter()
    this.ticker.emitter.on("tick", this.tick)

    this.ticks = 0

    this.rendering = true
  }

  provideRenderingContainer($container) {
    this.renderer.providerRenderingContainer($container)
  }

  start() {
    this.ticker.start()
  }

  stop() {
    this.ticker.stop()
  }

  toggle() {
    if (this.ticker.running) this.ticker.stop()
    else this.ticker.start()
  }

  tick = () => {
    const t = this.ticker.time,
      dt = this.ticker.dt

    Controls.update(t, dt)
    this.world.update()

    this.solver.prepare(t, dt)
    this.emitter.emit("solver:prepared")

    this.solver.solve(t, dt)
    this.emitter.emit("solver:updated")

    if (this.ticker.running && this.rendering) this.renderer.render(t, dt)

    this.ticks++
    // if (this.ticks === 300) this.stop()
  }
}
