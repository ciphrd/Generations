import { Node } from "../graph/node"
import { applyRule } from "../graph/rule"
import { rnd } from "../utils/rnd"

export function grow(center, dnas, maxNodes) {
  const nodes = [new Node(center)]
  nodes[0].edges.push(nodes[0])
  nodes[0].edges.push(nodes[0])
  nodes[0].edges.push(nodes[0])
  nodes[0].edges.push(nodes[0])
  for (const node of nodes) {
    node.data.clusterGroup = 0
    node.rule = rnd.el(dnas)
  }

  for (let i = 0; i < 1000 && nodes.length < maxNodes; i++) {
    for (
      let L = nodes.length, j = L - 1;
      j >= 0 && nodes.length < maxNodes;
      j--
    ) {
      applyRule(nodes, rnd.el(nodes), dnas)
    }
  }

  return nodes
}
