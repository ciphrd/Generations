import { ComputeCache } from "../opti/compute-cache"
import { Metrics } from "../utils/metrics"

export class Solver {
  constructor(world, constraints) {
    this.world = world
    this.computeCache = new ComputeCache(this.world.bodies)
  }

  prepare(t, dt) {
    Metrics.time("solver:prepare")
    this.computeCache.prepare()

    for (let i = this.world.constraints.pre.length - 1; i >= 0; i--) {
      if (
        this.world.constraints.pre[i].apply(t, dt, this.computeCache) === false
      ) {
        this.world.constraints.pre.splice(i, 1)
      }
    }
    for (const body of this.world.organisms) {
      body.prepare(t, dt)
    }
    Metrics.timeEnd("solver:prepare")
  }

  solve(t, dt) {
    Metrics.time("solver:solve")

    Metrics.time("solve:signals:process")
    for (const body of this.world.organisms) {
      body.processSignals(t, dt)
    }
    Metrics.timeEnd("solve:signals:process")

    Metrics.time("solve:bodies:update")
    for (const body of this.world.bodies) {
      body.update(t, dt)
    }
    Metrics.timeEnd("solve:bodies:update")

    Metrics.time("solve:constraints")
    for (let i = 0; i < this.world.constraints.post.length; i++) {
      this.world.constraints.post[i].apply(t, dt, this.computeCache)
    }
    Metrics.timeEnd("solve:constraints")

    for (const body of this.world.bodies) {
      body.clamp()
    }

    Metrics.timeEnd("solver:solve")
  }
}
