import { Node } from "../graph/node"
import { vec2 } from "../utils/vec"

export function importNetwork(def) {
  const nodes = []
  for (const nodeDef of def) {
    nodes.push(
      new Node(vec2(...nodeDef.pos), [
        new Uint8Array(),
        ...nodeDef.dnas.map((dna) => new Uint8Array(dna)),
      ])
    )
  }
  nodes.forEach((node, i) => {
    node.data.organism = 0
    node.edges = def[i].edges.map((j) => nodes[j])
    if (def[i].sensors) {
      node.sensors = def[i].sensors
    }
  })
  return nodes
}
