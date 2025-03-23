/**
 * Project inspirations
 * - Stephen Worlfram Physics project
 * - ALIEN simulation
 * - Clusters Jeffrey Ventrella
 */

import Stats from "stats.js"
import { BodyFlags, body } from "./physics/body"
import { Spring } from "./physics/constraints/spring"
import { Friction } from "./physics/constraints/friction"
import { CanvasRenderer } from "./renderer/canvas/renderer"
import { vec2 } from "./utils/vec"
import { LAR, larf } from "./physics/constraints/lar"
import { Food } from "./physics/entities/food"
import { fract, lerp } from "./utils/math"
import { Mouse } from "./interactions/mouse"
import { GlobalRepulsion } from "./physics/constraints/repulsion"
import { applyRule } from "./graph/rule"
import { Node, nodeTupleId } from "./graph/node"
import { rnd } from "./utils/rnd"
import { Clusters } from "./physics/constraints/clusters"
import { Collisions } from "./physics/constraints/collisions"
import { SquareBounds } from "./physics/constraints/bounds"
import { World } from "./physics/world"
import { Solver } from "./physics/solver"
import { behaviors, permutations, settings } from "./settings"
import { createDna, createDnas } from "./growth/dna"
import { grow } from "./growth/growth"
import { arr } from "./utils/array"
import { getPermutations } from "./opti/permutations"

Object.getOwnPropertyNames(Math).forEach((el) => (window[el] = Math[el]))
window.TAU = 2 * PI

const stats = new Stats()
stats.showPanel(1)
document.body.appendChild(stats.dom)

// todo
// [ ] Add some basic signal system to test the different options
// [ ] Implement predefined functions for the signal processing
// [ ] Test different options:
//     [ ] growth/activation DNA strands with a 2 step process: growth, then
//         activation happening through the signaling system
//     [ ] growth-in-activation: growth happens as any other function of the
//         activation system.

// todo
// - square rules
//   "{{{x,y},{y,z},{z,w},{w,x}}->{{x,y},{y,z},{z,w},{w,x},{y,x},{z,y},{w,z},{x,w},{x,z},{y,w},{z,v},{v,u},{u,y},{v,y},{z,u}}}",
// - rules can apply behaviors to nodes
// - (Implement hypergraphs (an edge can link multiple nodes at once))
//   not sure it will yield great results, if we good good results from
//   previous steps that's fine.
// - add other resources in the environment
//   - random other bodies, maybe cannot be food ?
//   - ...
// - add topology in the environment: some colliders which can't be passed
//   by other bodies (we may want to optimize there if we use big bodies, as
//   the current collisions are computed with small radiuses)

async function start() {
  const perms = await getPermutations()

  const world = new World()

  const DNAs = createDnas(settings.dnas.nb, {
    permutations,
    propsRange: {
      min: 5,
      max: 10,
    },
    nClusters: settings.clusters.nb,
  })
  console.log("DNAs:")
  arr.log(DNAs)

  const nodes = grow(
    vec2(0.501, 0.502),
    DNAs,
    lerp(30, 350, pow($fx.rand(), 2))
  )
  arr.log(nodes, (n) => n.rule)

  const bodies = []
  const constraints = { pre: [], post: [] }

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
    const bod = body(node.pos, settings.radius)
    bod.data = node.data
    bodies.push(bod)
    constraints.pre.push(new Friction(bod, 0.02))

    let nEdges = node.edges.length
    for (const node2 of nodes) {
      if (node === node2) continue
      nEdges += node2.edges.filter((e) => e === node).length
    }

    // if (nEdges === 1) {
    //   bod.color = "yellow"
    //   constraints.pre.push(new FoodSeeker(bod, world), new Eater(bod, world))
    // }

    for (const [name, enabled] of Object.entries(node.behaviors)) {
      if (!enabled) continue
      constraints.pre.push(new behaviors[name](bod, world))
    }
  }

  const edgemap = {}
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    for (const edge of node.edges) {
      if (node === edge) continue
      if (edgemap[nodeTupleId([node, edge])]) continue
      edgemap[nodeTupleId([node, edge])] = true
      constraints.pre.push(
        new Spring(bodies[i], bodies[nodes.indexOf(edge)], 0.002, 100, 15)
      )
    }
  }

  const clusterRules = Array(settings.clusters.nb ** 2)
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
        ) * (fract(sqrt(i)) === 0 ? 0.02 : 1),
        rnd.range(
          settings.clusters.rep.strength.min,
          settings.clusters.rep.strength.max
        )
      ),
    }
  }

  console.log({ clusterRules })

  bodies.forEach((body) => {
    body.color = settings.clusters.colors[body.data.clusterGroup]
    body.addFlag(BodyFlags.REPELLING | BodyFlags.REPELLED | BodyFlags.DEBUG)
  })

  const testBodies = []
  const NB = 25
  for (let i = 0; i < NB; i++) {
    for (let j = 0; j < NB; j++) {
      const bod = body(
        vec2((i + 0.5) / NB, (j + 0.5) / NB),
        settings.radius * 0.4
      )
      bod.addFlag(BodyFlags.REPELLING | BodyFlags.REPELLED)
      testBodies.push(bod)
      constraints.pre.push(new Friction(bod, 0.02))
    }
  }

  const allBodies = [...food, ...testBodies, ...bodies]

  constraints.pre.push(new Clusters(bodies, clusterRules, settings.clusters.nb))
  constraints.pre.push(
    new GlobalRepulsion(allBodies, {
      radius: 0.05,
      strength: 0.0003,
    })
  )
  constraints.pre.push(
    new LAR(
      bodies.filter((body) => body.hasFlag(BodyFlags.FOOD_SEEKER)),
      food,
      {
        attr: larf(0.2, 0.05),
        rep: larf(0, 0),
      }
    )
  )
  constraints.post.push(new Collisions(allBodies))
  constraints.post.push(new SquareBounds(allBodies))

  world.setBodies(allBodies)
  const solver = new Solver(world, constraints)

  const renderer = new CanvasRenderer([allBodies, constraints.pre])
  Mouse.init(renderer.cvs)

  function tick(time, t, dt) {
    solver.solve(t, dt)
    renderer.render()
  }

  let time, lastTime, dt
  function loop() {
    stats.begin()
    time = performance.now()
    dt = min(time - lastTime, 30) / 1000
    lastTime = time
    tick(time, time, dt)
    requestAnimationFrame(loop)
    stats.end()
  }
  loop()
}
start()
