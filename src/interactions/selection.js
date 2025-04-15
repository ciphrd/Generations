import { BodyFlags } from "../physics/body"
import { Mouse } from "./mouse"

const SELECTION_RADIUS = 1

export class NodeSelection {
  constructor(world) {
    this.world = world
    this.hovered = null
    this.selected = world.organisms[0]

    const part = world.partition(SELECTION_RADIUS, BodyFlags.ORGANISM)
    Mouse.on("move", () => {
      let lowd = Infinity,
        b = null,
        d
      for (const body of part.posNeighbours(Mouse.pos)) {
        d = Mouse.pos.dist(body.pos)
        if (d < SELECTION_RADIUS && d < lowd) {
          lowd = d
          b = body
        }
      }
      this.hovered = b
    })

    Mouse.on("down", () => {
      this.selected = this.hovered
    })
  }

  is(body) {
    return this.selected === body
  }
}
