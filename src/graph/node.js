let globalIndex = 0
export class Node {
  constructor(pos, rule, edges = []) {
    this.pos = pos
    this.id = (globalIndex++).toString()
    this.edges = edges
    this.rule = rule
    this.data = {
      clusterGroup: -1,
    }
    this.behaviors = {}
  }
}

export function nodeTupleId(nodes) {
  return nodes
    .map((node) => node.id)
    .sort((a, b) => b - a)
    .join("-")
}
