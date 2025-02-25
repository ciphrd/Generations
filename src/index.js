/**
 * Plan
 * - basic math fns
 * - basic physics engine
 * - physic constraints as building blocks
 *   - springs
 *   - attraction/repulsion module
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

const arr = Object.getOwnPropertyNames(Math)
arr.forEach((el) => (window[el] = Math[el]))
window.TAU = 2 * PI

const rules = [
  "re{{x,y},{x,z},{x,w}}->{{v,u},{u,v},{v,t},{u,t},{t,v},{t,u},{v,y},{u,z},{t,w}}",
  "re{{x,y},{y,z},{z,w}}->{{x,y},{y,z},{z,w},{x,v},{v,u},{u,z}};ra{v->5}",
  "re{{x,y},{x,z}}->{{x,y},{x,z},{w,x},{v,z},{w,v},{u,x},{u,w}}",
  "re{{x,y},{x,z}}->{{x,y},{x,z},{w,x},{v,z},{w,v}}",
  "re{{x,y},{x,z}}->{{x,y},{x,z},{w,x},{w,y}}",
  "re{{x,y},{y,z}}->{{x,y},{y,w},{w,y},{z,x}}",
  "re{{x,y}}->{{x,w},{w,v},{v,y}};ra{v->3}",
  "re{{x,y},{x,z}}->{{x,y},{y,z},{z,w}}",
  "re{{x,y},{x,z}}->{{x,w},{y,w},{z,w}}",
  "re{{x,y},{x,z}}->{{x,y},{x,w},{y,w},{z,w}};ra{w->1}",
  "re{{x,y},{x,z}}->{{x,w},{y,w},{z,w}};ra{w->0}",
]

const nodes = [new Node(vec2(0.5, 0.5), rules[0])]
nodes[0].edges.push(nodes[0])
nodes[0].edges.push(nodes[0])
nodes[0].edges.push(nodes[0])
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

for (let i = 0; i < 200 && nodes.length < 200; i++) {
  // for (let L = nodes.length, j = L - 1; j >= 0; j--) {
  applyRule(nodes, rndarr(nodes), rules)
  // }
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
  constraints.push(new Friction(bod, 0.003))

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
      new Spring(bodies[i], bodies[nodes.indexOf(edge)], 0.02, 100, 30)
    )
  }
}

// const bacteria = growMultiBacteria(vec2(0.5, 0.5), 6, food, {
//   stiffness: 20,
//   damping: 0.5,
//   nMaxBodies: 20,
//   segLen: 0.02,
//   segLenVar: 0.2,
// })
// bodies.push(...bacteria.bodies)
// constraints.push(...bacteria.constraints)

// const membrane = growDoubleMembrane(50, vec2(0.5, 0.5), 0.3, 0.03, {
//   stiffness: 100,
//   damping: 10,
// })

// bodies.push(...membrane.bodies)
// constraints.push(...membrane.constraints)

// const section = growSection(membrane.parts.inner.bodies, 10, 0, 20, 0.02, {
//   stiffness: 100,
//   damping: 8,
//   contracted: 0.5,
// })
// bodies.push(...section.bodies)
// constraints.push(...section.constraints)

// for (let i = 0; i < 10; i++) {
//   const arm = growArm(membrane.parts.outer.bodies[i * 2], 8, food)
//   bodies.push(...arm.bodies)
//   constraints.push(...arm.constraints)
// }

bodies.forEach((body) => body.addFlag(BodyFlags.GLOBAL_REPULSION))

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
testBodies.forEach((body) => body.addFlag(BodyFlags.GLOBAL_REPULSION))

const allBodies = [...food, ...testBodies, ...bodies]

const rep = new GlobalRepulsion(allBodies, {
  radius: 0.05,
  strength: 0.0003,
})
constraints.push(rep)

const renderer = new CanvasRenderer([...allBodies, ...constraints])
Mouse.init(renderer.cvs)

function tick(time, dt) {
  for (const constraint of constraints) {
    constraint.apply(dt)
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
