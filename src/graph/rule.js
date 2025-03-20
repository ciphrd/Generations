import { settings } from ".."
import { delarr } from "../utils/array"
import { clamp, clamp01 } from "../utils/math"
import { parseParams } from "../utils/parse"
import { rnd } from "../utils/rnd"
import { Node } from "./node"

const regpart = /^{(.*)}$/
const regparts = /({[^{}]*})/g
const regins = /^([a-z]+)({.*})$/

// todo; define functions better so that it's not hard-coded
export const execFunctions = [
  "permut",
  "assign",
  "cluster",
  "rnd",
  "dna",
  "ref",
  "either",
  "gt",
  "behavior",
]

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
      cluster: (target, group) => {
        return {
          cluster: {
            ...state.cluster,
            [target]: floor(clamp(parseInt(group), 0, settings.clusters.nb)),
          },
        }
      },
      behavior: (target, behavior) => {
        return {
          behaviors: {
            ...state.behaviors,
            [target]: behavior,
          },
        }
      },
      rnd: $fx.rand,
      dna: (idx) => {
        return rules[floor(clamp(idx, 0, settings.dnas.nb))]
      },
      ref(idx) {
        return exec(this.dna(idx), context)
      },
      either: (left, right, statement) => (statement ? left : right),
      gt: (left, right) => left > right,
    }

    const out = fns[fn](...params)
    // console.log({ instruction, parsed, out })
    return out
  }

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
  // todo
  // add fns who can read node values
  // here change how we exec the rules
  // permut 1st
  // then compute permut nodes, to have associations
  // then compute other rules

  const instructions = {}
  const context = exec(node.rule, { rules })
  // console.log({ context })
  const { permut, assign = {}, cluster = {}, behaviors = {} } = context
  if (!permut) throw "fatal"

  console.log(context.behaviors)

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

  const inputLetters = input.reduce((a, b) => b.concat(a), [])
  function spawnNode() {
    const parent = nodemap[rnd.el(inputLetters)]
    const out = new Node(
      node.pos
        .clone()
        .add(
          rnd.range(0.0001, 0.01) * rnd.sign(),
          rnd.range(0.0001, 0.01) * rnd.sign()
        )
        .apply(clamp01),
      node.rule
    )
    out.data = { ...parent.data }
    return out
  }

  // console.log({ cluster, assign })

  for (const [a, b] of output) {
    if (!nodemap[a]) {
      nodemap[a] = spawnNode(a)
    }
    if (!nodemap[b]) {
      nodemap[b] = spawnNode(b)
    }
    nodemap[a].edges.push(nodemap[b])

    // todo:
    // there seems to be a bug, all the nodes have the same rule ?
    if (a in assign) nodemap[a].rule = assign[a]
    if (b in assign) nodemap[b].rule = assign[b]
  }

  for (const [target, group] of Object.entries(cluster)) {
    nodemap[target].data.clusterGroup = group
  }

  for (const [target, behavior] of Object.entries(behaviors)) {
    const active = behavior.slice(0, 1) === "+"
    const name = behavior.slice(1)
    nodemap[target].behaviors[name] = active
  }

  for (const n of Object.values(nodemap)) {
    if (!nodes.includes(n)) {
      nodes.push(n)
    }
  }
}
