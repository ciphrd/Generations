import { SpacePartition } from "../opti/hash-partition"
import { BodyFlags } from "./body"

export class World {
  constructor(bodies = []) {
    this.setBodies(bodies)
    this.partitions = {}
  }

  setBodies(bodies = []) {
    this.bodies = bodies
    this.food = bodies.filter((body) => body.hasFlag(BodyFlags.FOOD))
    this.organisms = bodies.filter((body) => body.hasFlag(BodyFlags.ORGANISM))
  }

  partition(radius, flags) {
    if (!this.partitions[radius]) {
      this.partitions[radius] = new SpacePartition(
        this.bodies.filter((body) => body.hasFlag(flags)),
        radius
      )
    }

    return this.partitions[radius]
  }

  update() {
    for (const K in this.partitions) {
      this.partitions[K].update()
    }
  }
}
