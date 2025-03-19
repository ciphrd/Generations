import { ComputeCache } from "../opti/compute-cache"

export class Solver {
  constructor(world, constraints) {
    this.world = world
    this.constraints = constraints
    this.computeCache = new ComputeCache(this.world.bodies)
  }

  solve(dt) {
    this.computeCache.prepare()

    for (let i = this.constraints.pre.length - 1; i >= 0; i--) {
      if (this.constraints.pre[i].apply(dt, this.computeCache) === false) {
        this.constraints.pre.splice(i, 1)
      }
    }
    for (const body of this.world.bodies) {
      body.update(dt)
    }
    for (let i = 0; i < this.constraints.post.length; i++) {
      this.constraints.post[i].apply(dt, this.computeCache)
    }
  }
}
