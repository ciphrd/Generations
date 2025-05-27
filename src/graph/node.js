import { CPU } from "../bytecode/cpu"
import { GrowthBytecode } from "../bytecode/growth"
import { settings } from "../settings"

let globalIndex = 0
export class Node {
  constructor(pos, dna, edges = []) {
    this.pos = pos
    this.id = (globalIndex++).toString()
    this.edges = edges
    this.setDNA(dna)
    this.data = {
      clusterGroup: -1,
      organism: -1,
    }
    this.sensors = {}
    this.color = settings.cells.default.color.clone()
  }

  setDNA(dna) {
    this.dna = dna
    if (dna) this.cpu = new CPU(dna[0], GrowthBytecode)
  }
}

export function nodeTupleId(nodes) {
  return nodes
    .map((node) => node.id)
    .sort((a, b) => b - a)
    .join("-")
}
