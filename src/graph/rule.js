import { delarr } from "../utils/array"
import { clamp, clamp01 } from "../utils/math"
import { Node } from "./node"

const regpart = /^{(.*)}$/
const regparts = /({[^{}]*})/g
const regins = /^([a-z]+)({.*})$/

function components(groups) {}

export function applyRule(nodes, node, rules) {
  const instructions = {}
  for (const ins of node.rule.split(";")) {
    const [_, id, value] = regins.exec(ins)
    instructions[id] = value
  }

  const rule = instructions.re
  console.log(rule)
  if (!rule) throw "fatal"

  const ruleAssign = {}
  if (instructions.ra) {
    for (const match of instructions.ra.matchAll(/([a-z]->\d+)/g)) {
      const [letter, ruleIdx] = match[0].split("->")
      ruleAssign[letter] = ruleIdx
    }
  }

  console.log("parse:")
  console.log(
    rule
      .split("->")
      .map((a) =>
        [...regpart.exec(a)[1].matchAll(regparts)].map((a) =>
          regpart.exec(a[1])[1].split(",")
        )
      )
  )

  const [input, output] = rule
    .split("->")
    .map((a) =>
      [...regpart.exec(a)[1].matchAll(regparts)].map((a) =>
        regpart.exec(a[1])[1].split(",")
      )
    )

  // map letter-identifier to node object
  const nodemap = {
    x: node,
  }
  // keep track of which edges have already been used when parsing
  const edges = {}

  // a function which returns the index of an edge A->B, if it exists and is
  // still available (once an edge is used by the input it cannot be used again)
  // if b is undefined, returns the first available edge of node A
  function matchEdge(a, b) {
    let match = null
    if (!edges[a.id]) edges[a.id] = []
    for (let i = 0; i < a.edges.length; i++) {
      if (edges[a.id].includes(i)) continue
      if (!b || a.edges[i] === b) {
        match = { i, node: a.edges[i] }
        break
      }
    }
    if (match) edges[a.id].push(match.i)
    return match?.node || null
  }

  // parse the input to associate letters with nodes
  for (const [a, b] of input) {
    console.log({ a, b })
    if (!nodemap[a]) {
      console.log("node doesn't exist")
      return false
    }
    if (nodemap[a].edges.length === 0) {
      console.log("node doesn't have any edge")
      return false
    }

    const match = matchEdge(nodemap[a], nodemap[b])
    if (!match) {
      console.log("no match found")
      return false
    }
    if (!nodemap[b]) nodemap[b] = match
  }

  console.log(nodemap)
  console.log(edges)

  // remove all used edges
  for (const id in edges) {
    const node = nodes.find((n) => n.id === id)
    // need to start removing from highest to lowest index
    const sortedEdges = edges[id].sort((a, b) => b - a)
    for (const idx of sortedEdges) {
      node.edges.splice(idx, 1)
    }
  }

  function spawnNode() {
    return new Node(
      node.pos
        .clone()
        .add(($fx.rand() - 0.5) * 0.2, ($fx.rand() - 0.5) * 0.2)
        .apply(clamp01),
      node.rule
    )
  }

  for (const [a, b] of output) {
    if (!nodemap[a]) {
      nodemap[a] = spawnNode(a)
    }
    if (!nodemap[b]) {
      nodemap[b] = spawnNode(b)
    }
    nodemap[a].edges.push(nodemap[b])

    if (ruleAssign[a]) nodemap[a].rule = rules[ruleAssign[a]]
    if (ruleAssign[b]) nodemap[b].rule = rules[ruleAssign[b]]
  }

  for (const n of Object.values(nodemap)) {
    if (!nodes.includes(n)) {
      nodes.push(n)
    }
  }
}
