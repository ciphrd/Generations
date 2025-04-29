import { ComputeCache } from "../opti/compute-cache"

export class Solver {
  constructor(world, constraints) {
    this.world = world
    this.computeCache = new ComputeCache(this.world.bodies)
  }

  prepare(t, dt) {
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
  }

  solve(t, dt) {
    for (const body of this.world.organisms) {
      body.processSignals(t, dt)
    }
    for (const body of this.world.bodies) {
      body.update(t, dt)
    }
    for (let i = 0; i < this.world.constraints.post.length; i++) {
      this.world.constraints.post[i].apply(t, dt, this.computeCache)
    }
  }
}
