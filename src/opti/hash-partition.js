import { Cache } from "../utils/cache"

export class SpacePartition {
  /**
   * A target radius is used to compute the most optimal cell resolution for the
   * partitions.
   */
  constructor(bodies, targetRadius) {
    this.divs = floor(1 / targetRadius)
    this.space = [...Array(this.divs ** 2)].map((_) => [])
    this.hashes = new Cache()
    this.bodies = bodies
  }

  update() {
    this.space.forEach((slot) => (slot.length = 0))
    this.hashes.reset()
    for (const body of this.bodies) {
      this.space[this.#hash(body)].push(body)
    }
  }

  neighbours(body) {
    return this.#hashNeighbours(this.#hash(body))
  }

  posNeighbours(pos) {
    return this.#hashNeighbours(this.#hashPos(pos))
  }

  #hash(body) {
    return this.hashes.get(body.id, () => this.#hashPos(body.pos))
  }

  #hashPos(pos) {
    const x = floor(pos.x * this.divs)
    const y = floor(pos.y * this.divs)
    return x + y * this.divs
  }

  #hashNeighbours(hash) {
    const x = hash % this.divs
    const y = floor(hash / this.divs)
    const cells = Array(9)
    for (let dx = max(0, x - 1); dx <= min(x + 1, this.divs - 1); dx++) {
      for (let dy = max(0, y - 1); dy <= min(y + 1, this.divs - 1); dy++) {
        cells[dx - x + 1 + (dy - y + 1) * 3] = this.space[dx + dy * this.divs]
      }
    }
    return cells.flat()
  }
}
