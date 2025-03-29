import { CPU } from "../bytecode/cpu"
import { GrowthBytecode } from "../bytecode/growth"

let globalIndex = 0
export class Node {
  constructor(pos, dna, edges = []) {
    this.pos = pos
    this.id = (globalIndex++).toString()
    this.edges = edges
    this.setDNA(dna)
    this.data = {
      clusterGroup: -1,
    }
    this.sensors = {}
  }

  setDNA(dna) {
    this.dna = dna
    this.cpu = new CPU(dna, GrowthBytecode)
  }
}

export function nodeTupleId(nodes) {
  return nodes
    .map((node) => node.id)
    .sort((a, b) => b - a)
    .join("-")
}
