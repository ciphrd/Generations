import { delarr } from "../utils/array"
import { clamp, clamp01 } from "../utils/math"
import { parseParams } from "../utils/parse"
import { rnd } from "../utils/rnd"
import { Node } from "./node"

const regpart = /^{(.*)}$/
const regparts = /({[^{}]*})/g
const regins = /^([a-z]+)({.*})$/

const t = {}
function exec(instructions, context) {
  let state = {}
  const { rules } = context

  function execSingle(instruction, state) {
    const parsed = /^([a-z]+)\((.*)\)$/.exec(instruction)
    if (!parsed) return instruction

    const [fn, param] = [parsed[1], parsed[2]]
    const params = parseParams(param).map((par) => execSingle(par, context))

    const fns = {
      permut: (param) => {
        return {
          ...state,
          permut: param,
        }
      },
      assign: (target, effect) => ({
        ...state,
        assign: {
          ...(state.assign || {}),
          [target]: effect,
        },
      }),
      rnd: $fx.rand,
      dna: (idx) => rules[idx],
      ref(idx) {
        return exec(this.dna(idx), context)
      },
      either: (left, right, statement) => (statement ? left : right),
      gt: (left, right) => left > right,
    }

    const out = fns[fn](...params)
    console.log({ instruction, parsed, out })
    return out
  }

  console.log({ instructions })
  for (const ins of instructions.split(";")) {
    const res = execSingle(ins, state)
    state = {
      ...state,
      ...res,
    }
  }

  return state
}

export function applyRule(nodes, node, rules) {
  console.log("===============")
  console.log(node.rule)
  const instructions = {}
  const context = exec(node.rule, { rules })
  console.log(context)
  const { permut, assign = {} } = context
  if (!permut) throw "fatal"

  console.log("parse:")
  console.log({ permut })
  console.log(
    regpart
      .exec(permut)[1]
      .split("->")
      .map((a) =>
        [...regpart.exec(a)[1].matchAll(regparts)].map((a) =>
          regpart.exec(a[1])[1].split(",")
        )
      )
  )

  const [input, output] = permut
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
    const bias = rnd.int(0, a.edges.length)
    for (let i = 0; i < a.edges.length; i++) {
      const di = (i + bias) % a.edges.length
      if (edges[a.id].includes(di)) continue
      if (!b || a.edges[di] === b) {
        match = { i: di, node: a.edges[di] }
        break
      }
    }
    if (match) edges[a.id].push(match.i)
    return match?.node || null
  }

  // parse the input to associate letters with nodes
  for (const [a, b] of input) {
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

    if (assign[a]?.rule) nodemap[a].rule = assign[a].rule
    if (assign[b]?.rule) nodemap[b].rule = assign[b].rule
  }

  for (const n of Object.values(nodemap)) {
    if (!nodes.includes(n)) {
      nodes.push(n)
    }
  }
}
