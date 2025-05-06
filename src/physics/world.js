import { SpacePartition } from "../opti/hash-partition"
import { arr } from "../utils/array"
import { emitter } from "../utils/emitter"
import { BodyFlags } from "./body"
import { Spring } from "./constraints/spring"

export class World {
  constructor(bodies = [], constraints = []) {
    this.setBodies(bodies)
    this.setConstraints(constraints)
    this.partitions = {}
    this.emitter = emitter()
  }

  setConstraints(constraints) {
    this.constraints = constraints
    this.liaisons = constraints.pre?.filter((cons) => cons instanceof Spring)
  }

  setBodies(bodies) {
    this.bodies = bodies
    this.#deriveGroups()
  }

  includesBody(body) {
    return body.id in this.bodiesMap
  }

  #deriveGroups() {
    this.bodiesMap = Object.fromEntries(
      this.bodies.map((body, i) => [body.id, i])
    )
    this.food = this.bodies.filter((body) => body.hasFlag(BodyFlags.FOOD))
    this.organisms = this.bodies.filter((body) =>
      body.hasFlag(BodyFlags.ORGANISM)
    )
    this.bacterias = this.bodies.filter((body) =>
      body.hasFlag(BodyFlags.BACTERIA)
    )
  }

  addConstraint(stage, constraint) {
    this.constraints[stage].push(constraint)
    this.emitter.emit("constraints:updated")
  }

  removeConstraint(stage, constraint) {
    arr.del(this.constraints[stage], constraint)
    this.emitter.emit("constraints:updated")
  }

  removeBody(body) {
    arr.del(this.bodies, body)
    this.#deriveGroups()
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
    this.emitter.runQueue()
    for (const K in this.partitions) this.partitions[K].update()
  }
}
