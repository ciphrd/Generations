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
import { growMembrane } from "./growth/membrane"
import { Mouse, MouseFollow } from "./interactions/mouse"
import { SpacePartition } from "./utils/hash-partition"
import { GlobalRepulsion } from "./physics/constraints/repulsion"

const stats = new Stats()
stats.showPanel(1)
document.body.appendChild(stats.dom)

const arr = Object.getOwnPropertyNames(Math)
arr.forEach((el) => (window[el] = Math[el]))
window.TAU = 2 * PI

const bodies = []
const constraints = []

// const membrane = growMembrane(100, vec2(0.5, 0.5), 0.3, {
//   stiffness: 10,
//   dampening: 10,
// })

// bodies.push(...membrane.bodies)
// constraints.push(...membrane.constraints)

// constraints.push(new MouseFollow(membrane.bodies[0]))

// const food = []
// for (let i = 0; i < 40; i++) {
//   food.push(
//     new Food(vec2($fx.rand(), $fx.rand()), (fd) =>
//       food.splice(food.indexOf(fd), 1)
//     )
//   )
// }

// const armExtremities = []
// for (let i = 0; i < 1; i++) {
//   const arm = growArm(bodies[i * 2], 3, food)
//   bodies.push(...arm.bodies)
//   constraints.push(...arm.constraints)
// }

// for (const extr of armExtremities) {
//   constraints.push(
//     new LAR(extr, armExtremities, {
//       attr: larf(0, 0),
//       rep: larf(0.3, 0.02),
//     })
//   )
// }

const testBodies = []
const NB = 40
for (let i = 0; i < NB; i++) {
  for (let j = 0; j < NB; j++) {
    const bod = body(vec2((i + 0.5) / NB, (j + 0.5) / NB))
    bod.addFlag(BodyFlags.GLOBAL_REPULSION)
    testBodies.push(bod)
  }
}
const rep = new GlobalRepulsion(testBodies, {
  radius: 0.05,
  strength: 0.001,
})

constraints.push(rep)

// const renderer = new CanvasRenderer([...food, ...bodies, ...constraints])
const renderer = new CanvasRenderer(testBodies)
Mouse.init(renderer.cvs)

function tick(time, dt) {
  for (const constraint of constraints) {
    constraint.apply(dt)
  }
  for (const body of testBodies) {
    body.update(dt)
  }
  renderer.render()
}

let lastFrameTime
function loop() {
  stats.begin()
  const time = performance.now()
  const dt = (time - lastFrameTime) / 1000
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
