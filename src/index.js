/**
 * Plan
 * - basic math fns
 * - basic physics engine
 * - physic constraints as building blocks
 *   - springs
 *   - attraction/repulsion module
 */

/**
 * Project inspirations
 * - Stephen Worlfram Physics project
 * - ALIEN simulation
 * - Clusters Jeffrey Ventrella
 */

import Stats from "stats.js"
import { Body, BodyFlags, body } from "./physics/body"
import { Spring } from "./physics/constraints/spring"
import { Friction } from "./physics/constraints/friction"
import { CanvasRenderer } from "./renderer/canvas/renderer"
// import { canvasRenderer } from "./renderer/canvas"
import { vec2 } from "./utils/vec"
import { growArm } from "./growth/arm"
import { LAR, larf } from "./physics/constraints/lar"
import { Food } from "./physics/entities/food"
import { Alignement } from "./physics/constraints/alignment"
import { mod } from "./utils/math"
import { growDoubleMembrane, growMembrane } from "./growth/membrane"
import { Mouse, MouseFollow } from "./interactions/mouse"
import { SpacePartition } from "./utils/hash-partition"
import { GlobalRepulsion } from "./physics/constraints/repulsion"
import { growSection } from "./growth/section"
import { growBacteria, growMultiBacteria } from "./growth/bacteria"
import { applyRule } from "./graph/rule"
import { Node, nodeTupleId } from "./graph/node"
import { Eater } from "./interactions/eat"
import { rndarr } from "./utils/array"
import { rnd } from "./utils/rnd"
import { Clusters } from "./physics/constraints/clusters"

const arr = Object.getOwnPropertyNames(Math)
arr.forEach((el) => (window[el] = Math[el]))
window.TAU = 2 * PI

// todo
// function which sets cluster group instead of random

const rules = [
  "permut({{{x,y},{y,z}}->{{w,x},{x,w},{w,z},{x,v},{y,z}}})",
  "permut({{{x,y},{y,z},{z,w},{w,x}}->{{x,y},{z,w},{w,x},{y,v},{v,u},{u,z},{z,y},{y,u}}})",
  "permut({{{x,y},{y,z},{z,w},{w,x}}->{{x,y},{y,x},{z,w},{w,z},{w,x},{x,w},{y,v},{v,y},{v,u},{u,v},{u,z},{z,u},{z,y},{y,z},{y,u},{u,y}}})",
  "permut({{{x,y}}->{{x,z},{z,w},{y,z}}})",
  "either(ref(2),ref(8),gt(rnd(),0.5))",
  "permut({{{x,y},{y,z},{z,w},{w,v},{v,x}}->{{x,y},{y,z},{z,w},{w,v},{v,x},{y,x},{u,y},{t,u},{s,t},{x,s}}})",
  "permut({{{x,y},{x,z}}->{{y,w},{y,z},{w,x}}})",
  "permut({{{x,y},{x,z}}->{{w,x},{w,x},{w,y},{v,x},{z,v}}})",
  "permut({{{x,y},{x,y}}->{{z,y},{z,y},{y,x},{x,z}}});assign(z,dna(3))",
  "permut({{{x,y},{x,z},{x,w}}->{{v,u},{u,v},{v,y},{v,t},{y,t},{u,z},{w,v}}})",
  "permut({{{x,y},{x,z}}->{{y,y},{y,w},{x,w},{z,w}}})",
  "permut({{{x,y},{x,z}}->{{w,y},{w,v},{y,v},{v,z}}})",
  "permut({{{x,y},{y,z}}->{{w,y},{y,w},{w,z},{x,w}}})",
  "permut({{{x,y},{y,z}}->{{w,y},{y,w},{w,v},{w,x},{z,v}}})",
  "permut({{{x,y},{y,z}}->{{x,y},{y,z},{z,w},{w,v},{v,x}}})",
  "permut({{{x,y}}->{{x,y},{y,z},{z,w},{w,v},{v,x}}})",
  "permut({{{x,y},{y,z},{z,w},{w,x}}->{{x,y},{y,z},{z,w},{w,x},{y,v},{v,u},{u,z},{z,y},{y,u}}})",
  "permut({{{x,y},{x,z},{x,w}}->{{v,y},{y,v},{v,z},{z,w},{w,y}}})",
  "permut({{{x,y}}->{{x,z},{x,z},{y,z},{y,z}}})",
  "permut({{{x,y},{z,y}}->{{w,y},{y,w},{w,x},{z,w}}})",
  "permut({{{x,y}}->{{x,z},{z,y}}})",
  "permut({{{x,y},{x,z},{x,w}}->{{y,v},{v,y},{y,u},{u,z},{w,y},{w,z}}})",
  "permut({{{x,y},{y,z},{z,w}}->{{w,z},{w,v},{z,y},{y,v},{u,w}}})",
  "permut({{{x,y},{x,z},{x,w}}->{{v,u},{u,v},{v,t},{u,t},{t,v},{t,u},{v,y},{u,z},{t,w}}})",
  "permut({{{x,y},{y,z},{z,w}}->{{x,y},{y,z},{z,w},{x,v},{v,u},{u,z}}})",
  "permut({{{x,y},{x,z}}->{{x,y},{x,z},{w,x},{v,z},{w,v},{u,x},{u,w}}})",
  "permut({{{x,y},{x,z}}->{{x,y},{x,z},{w,x},{v,z},{w,v}}})",
  "permut({{{x,y},{x,z}}->{{x,y},{x,z},{w,x},{w,y}}})",
  "permut({{{x,y},{y,z}}->{{x,y},{y,w},{w,y},{z,x}}})",
  "permut({{{x,y}}->{{x,w},{w,v},{v,y}}});assign(v,0)",
  "permut({{{x,y},{x,z}}->{{x,y},{y,z},{z,w}}})",
  "permut({{{x,y},{x,z}}->{{x,w},{y,w},{z,w}}})",
  "permut({{{x,y},{x,z}}->{{x,y},{x,w},{y,w},{z,w}}})",
  "permut({{{x,y},{x,z}}->{{x,w},{y,w},{z,w}}})})",
]

const nodes = [new Node(vec2(0.5, 0.5), rules[0])]
nodes[0].edges.push(nodes[0])
nodes[0].edges.push(nodes[0])
nodes[0].edges.push(nodes[0])
nodes[0].edges.push(nodes[0])
nodes[0].edges.push(nodes[0])
nodes[0].edges.push(nodes[0])
// nodes[0].edges.push(nodes[0])
// nodes[0].edges.push(nodes[0])
// nodes[1].edges.push(nodes[0])
// nodes[0].edges.push(nodes[2])
// nodes[2].edges.push(nodes[0])
// nodes[1].edges.push(nodes[2])
// nodes[2].edges.push(nodes[1])
// applyRule(nodes, nodes[0], "{{x,y}}->{{x,z}{z,y}}")

// function grow() {

// }

// Todos
// / Implement a generalized system which allows to define which rules are
//   passed to spawned nodes
// - Implement a system allowing different rules to be applied given conditions
//   ie branching of rules
// / Mutation rules ? instead of just spawning new nodes a rule could instruct
//   a mutation to be applied
// - rules can apply behaviors to nodes
// - (Implement hypergraphs (an edge can link multiple nodes at once))
//   not sure it will yield great results, if we good good results from
//   previous steps that's fine.

for (let i = 0; i < 50 && nodes.length < 400; i++) {
  for (let L = nodes.length, j = L - 1; j >= 0; j--) {
    // applyRule(nodes, nodes[j], rules)
    applyRule(nodes, rndarr(nodes), rules)
  }
}

for (const node of nodes) {
  console.log(`${node.id}->${node.edges.map((n) => n.id).join(",")}`)
}

let strEdges = []
for (const node of nodes) {
  for (const edge of node.edges) {
    strEdges.push(`${node.id} ${edge.id} 0`)
  }
}
// console.log(`{${strEdges.join("\n")}}`)

let mermaid = "flowchart TD\n"
for (const node of nodes) {
  mermaid += `${node.id}((${node.id}))\n`
}
for (const node of nodes) {
  for (const edge of node.edges) {
    mermaid += `${node.id} --> ${edge.id}\n`
  }
}
// console.log(mermaid)

const stats = new Stats()
stats.showPanel(1)
// document.body.appendChild(stats.dom)

const bodies = []
const constraints = []

const food = []
for (let i = 0; i < 100; i++) {
  food.push(
    new Food(vec2($fx.rand(), $fx.rand()), (fd) =>
      food.splice(food.indexOf(fd), 1)
    )
  )
}

//
//
for (const node of nodes) {
  const bod = body(node.pos)
  bod.addFlag(BodyFlags.GLOBAL_REPULSION)
  bodies.push(bod)
  constraints.push(new Friction(bod, 0.01))

  let nEdges = node.edges.length
  for (const node2 of nodes) {
    if (node === node2) continue
    nEdges += node2.edges.filter((e) => e === node).length
  }

  if (nEdges === 1) {
    bod.color = "yellow"
    constraints.push(
      new LAR(bod, food, {
        attr: larf(0.35, 0.01),
        rep: larf(0, 0),
      }),
      new Eater(bod, food, 0.02)
    )
  }
}

const edgemap = {}
for (let i = 0; i < nodes.length; i++) {
  const node = nodes[i]
  for (const edge of node.edges) {
    if (node === edge) continue
    if (edgemap[nodeTupleId([node, edge])]) continue
    edgemap[nodeTupleId([node, edge])] = true
    constraints.push(
      new Spring(bodies[i], bodies[nodes.indexOf(edge)], 0.02, 160, 10)
    )
  }
}

bodies.forEach((body) => body.addFlag(BodyFlags.GLOBAL_REPULSION))

const settings = {
  clusters: {
    attr: {
      range: {
        min: 0.05,
        max: 0.15,
      },
      strength: {
        min: 0.0001,
        max: 0.0002,
      },
    },
    rep: {
      range: {
        min: 0.01,
        max: 0.03,
      },
      strength: {
        min: 0.0008,
        max: 0.0016,
      },
    },
    colors: [
      "rgba(0,255,0,0.6)",
      "rgba(255,0,0,0.6)",
      "rgba(255,255,0,0.6)",
      "orange",
      "purple",
      "white",
    ],
  },
}

const NB_CLUSTERS = 3
const clusterRules = Array(NB_CLUSTERS ** 2)
for (let i = 0; i < clusterRules.length; i++) {
  clusterRules[i] = {
    attr: larf(
      rnd.range(
        settings.clusters.attr.range.min,
        settings.clusters.attr.range.max
      ),
      rnd.range(
        settings.clusters.attr.strength.min,
        settings.clusters.attr.strength.max
      )
    ),
    rep: larf(
      rnd.range(
        settings.clusters.rep.range.min,
        settings.clusters.rep.range.max
      ),
      rnd.range(
        settings.clusters.rep.strength.min,
        settings.clusters.rep.strength.max
      )
    ),
  }
}

bodies.forEach((body) => {
  body.data.clusterGroup = rnd.int(0, NB_CLUSTERS)
  body.color = settings.clusters.colors[body.data.clusterGroup]
  body.addFlag(BodyFlags.REPELLING)
})

constraints.push(new Clusters(bodies, clusterRules, NB_CLUSTERS))

// constraints.push(new MouseFollow(membrane.bodies[0]))

const testBodies = []
const NB = 25
for (let i = 0; i < NB; i++) {
  for (let j = 0; j < NB; j++) {
    const bod = body(vec2((i + 0.5) / NB, (j + 0.5) / NB))
    bod.addFlag(BodyFlags.WANDERING)
    bod.addFlag(BodyFlags.GLOBAL_REPULSION)
    testBodies.push(bod)
    constraints.push(new Friction(bod, 0.02))
  }
}
testBodies.forEach((body) =>
  body.addFlag(BodyFlags.REPELLING | BodyFlags.REPELLED)
)

const allBodies = [...food, ...testBodies, ...bodies]

const rep = new GlobalRepulsion(allBodies, {
  radius: 0.05,
  strength: 0.0003,
})
constraints.push(rep)

const renderer = new CanvasRenderer([allBodies, constraints])
Mouse.init(renderer.cvs)

function tick(time, dt) {
  for (let i = constraints.length - 1; i >= 0; i--) {
    const constraint = constraints[i]
    constraint.apply(dt, constraints)
  }
  for (const body of allBodies) {
    body.update(dt)
  }
  renderer.render()
}

let lastFrameTime
function loop() {
  stats.begin()
  const time = performance.now()
  const dt = min(time - lastFrameTime, 30) / 1000
  lastFrameTime = time
  tick(time, dt)
  stats.end()
  requestAnimationFrame(loop)
}

function start() {
  lastFrameTime = performance.now()
  loop()
}
start()
