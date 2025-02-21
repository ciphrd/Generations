import { Cache } from "./cache"

export class SpacePartition {
  /**
   * A target radius is used to compute the most optimal cell resolution for the
   * partitions.
   */
  constructor(bodies, targetRadius) {
    this.divs = floor(1 / targetRadius)
    this.space = [...Array(this.divs ** 2)].map((_) => [])
    this.hashes = new Cache()
    for (const body of bodies) {
      this.space[this.#hash(body)].push(body)
    }
  }

  neighbours(body) {
    const hash = this.#hash(body)
    const x = hash % this.divs
    const y = floor(hash / this.divs)

    // seems to be wrong somehow ?

    console.log("body x, y", x, y)

    const cells = Array(9)
    for (let dx = max(0, x - 1); dx <= min(x + 1, this.divs); dx++) {
      for (let dy = max(0, y - 1); dy <= min(y + 1, this.divs); dy++) {
        console.log({ dx, dy })
        console.log(dx - x + 1 + (dy - y + 1) * 3)
        cells[dx - x + 1 + (dy - y + 1) * 3] = this.space[dx + dy * this.divs]
      }
    }

    console.log(cells)

    return cells.flat()
  }

  #hash(body) {
    return this.hashes.get(body.id, () => {
      const x = floor(body.pos.x * this.divs)
      const y = floor(body.pos.y * this.divs)
      return x + y * this.divs
    })
  }
}
