import { SpacePartition } from "../opti/hash-partition"
import { arr } from "../utils/array"
import { emitter } from "../utils/emitter"
import { BodyFlags } from "./body"

export class World {
  constructor(bodies = [], constraints = []) {
    this.setBodies(bodies)
    this.setConstraints(constraints)
    this.partitions = {}
    this.emitter = emitter()
  }

  setConstraints(constraints) {
    this.constraints = constraints
  }

  setBodies(bodies) {
    this.bodies = bodies
    this.food = bodies.filter((body) => body.hasFlag(BodyFlags.FOOD))
    this.organisms = bodies.filter((body) => body.hasFlag(BodyFlags.ORGANISM))
  }

  addConstraint(stage, constraint) {
    this.constraints[stage].push(constraint)
  }

  removeConstraint(stage, constraint) {
    arr.del(this.constraints[stage], constraint)
  }

  removeBody(body) {
    arr.del(this.bodies, body)
    this.emitter.emit("bodies:updated")
  }

  partition(radius, flags = 0) {
    const K = (flags * 10 + radius).toString()
    if (!this.partitions[K]) {
      this.partitions[K] = new SpacePartition(this, flags, radius)
    }
    return this.partitions[K]
  }

  update() {
    for (const K in this.partitions) {
      this.partitions[K].update()
    }
  }
}
