import { ActivationBytecode } from "../bytecode/activation"
import { GrowthBytecode } from "../bytecode/growth"
import { bytecodeToMnemonics } from "../bytecode/utils"
import { BodyFlags } from "../physics/body"
import { emitter } from "../utils/emitter"
import { Mouse } from "./mouse"

const SELECTION_RADIUS = 1

export class NodeSelection {
  constructor(world) {
    this.world = world
    this.hovered = null
    this.selected = world.organisms[20]
    this.emitter = emitter()

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
      if (this.selected !== this.hovered) {
        this.selected = this.hovered
        console.log("---")
        console.log("Growth:")
        console.log(bytecodeToMnemonics(this.selected.dna[0], GrowthBytecode))
        console.log("Activation:")
        console.log(
          bytecodeToMnemonics(this.selected.dna[1], ActivationBytecode)
        )
        this.emitter.emit("change")
      }
    })
  }

  is(body) {
    return this.selected === body
  }
}
