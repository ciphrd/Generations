export class Engine {
  constructor({ world, solver, selection, ticker, renderer }) {
    this.world = world
    this.solver = solver
    this.selection = selection
    this.renderer = renderer
    this.ticker = ticker

    this.ticker.emitter.on("tick", this.tick)
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
    this.world.update()
    this.solver.solve(t, dt)

    if (this.ticker.running) this.renderer.render()
  }
}
