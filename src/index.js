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

const stats = new Stats()
stats.showPanel(1)
document.body.appendChild(stats.dom)

const arr = Object.getOwnPropertyNames(Math)
arr.forEach((el) => (window[el] = Math[el]))
window.TAU = 2 * PI

const bodies = []
const constraints = []

const membrane = growDoubleMembrane(50, vec2(0.5, 0.5), 0.3, 0.03, {
  stiffness: 100,
  damping: 10,
})

bodies.push(...membrane.bodies)
constraints.push(...membrane.constraints)

const section = growSection(membrane.parts.inner.bodies, 10, 0, 20, 0.02, {
  stiffness: 100,
  damping: 8,
  contracted: 0.5,
})
bodies.push(...section.bodies)
constraints.push(...section.constraints)

bodies.forEach((body) => body.addFlag(BodyFlags.GLOBAL_REPULSION))

// constraints.push(new MouseFollow(membrane.bodies[0]))

const food = []
for (let i = 0; i < 100; i++) {
  food.push(
    new Food(vec2($fx.rand(), $fx.rand()), (fd) =>
      food.splice(food.indexOf(fd), 1)
    )
  )
}

for (let i = 0; i < 10; i++) {
  const arm = growArm(bodies[i * 2], 8, food)
  bodies.push(...arm.bodies)
  constraints.push(...arm.constraints)
}

const testBodies = []
const NB = 0
for (let i = 0; i < NB; i++) {
  for (let j = 0; j < NB; j++) {
    const bod = body(vec2((i + 0.5) / NB, (j + 0.5) / NB))
    bod.addFlag(BodyFlags.GLOBAL_REPULSION)
    testBodies.push(bod)
    constraints.push(new Friction(bod, 0.02))
  }
}

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
