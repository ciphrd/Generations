import { Eater } from "../interactions/eat"
import { body } from "../physics/body"
import { Alignement } from "../physics/constraints/alignment"
import { Friction } from "../physics/constraints/friction"
import { LAR, larf } from "../physics/constraints/lar"
import { Spring } from "../physics/constraints/spring"
import { delarr, rndarr } from "../utils/array"
import { vec2 } from "../utils/vec"
import { triangulate } from "./utils/triangulate"

let idx = 0
function node() {
  return {
    idx: idx++,
    edges: [],
  }
}

function connect(a, b, len) {
  a.edges.push(b)
  b.edges.push(a)
  return { nodes: [a, b], len }
}

function disconnect(edge, edges) {
  const [a, b] = edge.nodes
  delarr(a.edges, b)
  delarr(b.edges, a)
  delarr(edges, edge)
}

function commonEdges(a, b) {
  return a.edges.filter((edge) => !!b.edges.includes(edge))
}

export function growBacteria(pos, nBodies, properties) {
  idx = 0

  const bodies = []
  const constraints = []
  const { stiffness, damping, segLen, segLenVar } = properties

  const nodes = [node(), node(), node()]
  const edges = [
    connect(nodes[0], nodes[1], segLen),
    connect(nodes[1], nodes[2], segLen),
    connect(nodes[2], nodes[0], segLen),
  ]

  function grow() {
    const edge = rndarr(edges, sqrt)
    const add = node()
    nodes.push(add)
    edges.push(
      ...edge.nodes.map((n) =>
        connect(add, n, edge.len * (1 + ($fx.rand() - 0.2) * segLenVar))
      )
    )
    if ($fx.rand() < 0.7) {
      disconnect(edge, edges)
    }
  }

  for (let i = 0; i < nBodies; i++, grow());

  // for (const node of nodes) {
  //   console.log(`${node.idx} -> ${node.edges.map((e) => e.idx).join(", ")}`)
  // }

  bodies.push(
    ...nodes.map((node) =>
      body(pos.clone().add($fx.rand() * 0.2, $fx.rand() * 0.2))
    )
  )
  const springs = edges.map(
    (edge) =>
      new Spring(
        bodies[edge.nodes[0].idx],
        bodies[edge.nodes[1].idx],
        edge.len,
        stiffness,
        damping
      )
  )
  const align = nodes.map(
    (node, i) =>
      new Alignement(
        bodies[i],
        node.edges.map((_, i) => bodies[i])
      )
  )
  constraints.push(
    ...springs,
    ...align,
    ...bodies.map((b) => new Friction(b, 0.01))
  )

  return {
    bodies,
    constraints,
    parts: {
      springs,
    },
  }
}

export function growMultiBacteria(pos, nParts, food, properties) {
  const { stiffness, damping, nMaxBodies } = properties
  const bodies = []
  const constraints = []
  const parts = []

  for (let i = 0; i < nParts; i++) {
    const bacteria = growBacteria(
      pos,
      2 + floor($fx.rand() * nMaxBodies - 2),
      properties
    )
    bodies.push(...bacteria.bodies)
    constraints.push(...bacteria.constraints)
    parts.push(bacteria)
    // each edge has a change to connect to another edge
    if (i > 0) {
      const nConn = 1 + floor(pow($fx.rand(), 4) * 30)
      for (let j = 0; j < nConn; j++) {
        const s1 = rndarr(bacteria.parts.springs)
        const s2 = rndarr(parts[i - 1].parts.springs)
        constraints.push(
          ...triangulate(s1.bodyA, s1.bodyB, s2.bodyA, s2.bodyB, 0.01, {
            stiffness,
            damping,
          })
        )
      }
    }
  }

  // constraints.push(
  //   ...parts[0].bodies.map(
  //     (bod) =>
  //       new LAR(bod, food, {
  //         attr: larf(0.3, 0.05),
  //         rep: larf(0, 0),
  //       })
  //   ),
  //   ...parts[0].bodies.map((bod) => new Eater(bod, food, 0.01))
  // )

  return { bodies, constraints }
}
