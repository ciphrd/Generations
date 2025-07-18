import { Node } from "../graph/node"
import { Params } from "../parametric-space"
import { arr } from "../utils/array"
import { rng, rng0 } from "../utils/rng"

export function grow(center, dnas, maxNodes) {
  const nodes = [new Node(center)]
  for (let i = 0; i < 8; i++) nodes[0].edges.push(nodes[0])
  for (const node of nodes) {
    node.data.clusterGroup = 0
    node.setDNA(Params.growthRngSequence.el(dnas))
  }

  let node
  for (let i = 0; i < 1000 && nodes.length < maxNodes; i++) {
    for (
      let L = nodes.length, j = L - 1;
      j >= 0 && nodes.length < maxNodes;
      j--
    ) {
      node = Params.growthRngSequence.el(nodes)
      node.cpu.prepare()
      node.cpu.run({
        node,
        nodes,
        dnas,
      })
    }
  }

  return labelOrganisms(nodes)
}

function labelOrganisms(nodes) {
  function traverse(node) {
    for (const n of nodeEdges(node, nodes)) {
      // if node is already labelled, it's been traversed already
      if (n.data.organism >= 0) continue
      n.data.organism = node.data.organism
      traverse(n)
    }
  }
  let id = 0
  for (const node of nodes) {
    if (node.data.organism >= 0) continue
    node.data.organism = id++
    traverse(node)
  }
  return nodes
}

function nodeEdges(node, nodes) {
  const linked = []
  for (const n of nodes) {
    if (n === node) continue
    if (n.edges.includes(node)) linked.push(n)
  }
  return arr.dedup([...node.edges, ...linked])
}
