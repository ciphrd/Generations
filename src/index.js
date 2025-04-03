/**
 * Project inspirations
 * - Stephen Worlfram Physics project
 * - ALIEN simulation
 * - Clusters Jeffrey Ventrella
 */

import Stats from "stats.js"
import { Body, BodyFlags, body } from "./physics/body"
import { Spring } from "./physics/constraints/spring"
import { CanvasRenderer } from "./renderer/canvas/renderer"
import { vec2 } from "./utils/vec"
import { LAR, larf } from "./physics/constraints/lar"
import { Food } from "./physics/entities/food"
import { clamp, fract, lerp } from "./utils/math"
import { Mouse } from "./interactions/mouse"
import { GlobalRepulsion } from "./physics/constraints/repulsion"
import { Node, nodeTupleId } from "./graph/node"
import { rnd } from "./utils/rnd"
import { Clusters } from "./physics/constraints/clusters"
import { Collisions } from "./physics/constraints/collisions"
import { SquareBounds } from "./physics/constraints/bounds"
import { World } from "./physics/world"
import { Solver } from "./physics/solver"
import { behaviors, permutations, settings } from "./settings"
import { generateDNAs } from "./growth/dna"
import { grow } from "./growth/growth"
import { arr } from "./utils/array"
import { getPermutations, getSeeds } from "./opti/seeds"
import { Token } from "./network/token"
import { VisionSensor } from "./sensors/vision"
import { SmellSensor } from "./sensors/smell"
import { ClockSensor } from "./sensors/clock"
import { CPU } from "./bytecode/cpu"
import { ActivationBytecode } from "./bytecode/activation"
import { GrowthBytecode } from "./bytecode/growth"
import { Sensors } from "./sensors"
import { Graph } from "./ui/graph"
import { NodeSelection } from "./interactions/selection"
import { StackGraph } from "./ui/stacks"

Object.getOwnPropertyNames(Math).forEach((el) => (window[el] = Math[el]))
window.TAU = 2 * PI

const stats = new Stats()
stats.showPanel(1)
stats.dom.style.position = "absolute"
stats.dom.style.left = "auto"
stats.dom.style.right = "0px" // Align to the right
stats.dom.style.top = "0px"
document.body.appendChild(stats.dom)

// todo
// [x] Add some basic signal system to test the different options
// [x] Body chemicals array instead of object
// [x] Implement predefined functions for the signal processing
// [ ] Test different options:
//     [ ] growth/activation DNA strands with a 2 step process: growth, then
//         activation happening through the signaling system
//     [ ] growth-in-activation: growth happens as any other function of the
//         activation system.
// [ ] Function to "follow sensor" - might get triggered as sensor spawn tokens
//     on the sensor node — could result in simple follow dynamics
// [ ] Parametrize clock (& more generally sensors), bounded by allowing for
//     variation during growth

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
  const seeds = await getSeeds()
  console.log({ seeds })

  const dnas = generateDNAs(seeds)
  console.log({ dnas })

  // const bytecode = "02d893d1e0"
  // const hexBytes = bytecode.match(/.{1,2}/g)
  // const bytes = hexBytes.map((hex) => parseInt(hex, 16))
  // console.log({ bytes })

  // const cpu = new CPU(seeds.activations.at(-1), ActivationBytecode)
  // cpu.run({
  //   body: new Body(vec2(0.5, 0.5), 0.1),
  // })

  const world = new World()

  const nodes = grow(vec2(0.501, 0.502), dnas, 200)
  arr.log(nodes, (n) => n.dna)

  // const rule1 = "permut({{{x,y}}->{{x,y}}});"
  // const rule2 = "permut({{{x,y}}->{{x,y}}});"

  // const n1 = new Node(vec2(0.48, 0.5), rule1)
  // const n2 = new Node(vec2(0.52, 0.5), rule2)
  // n1.edges.push(n2)
  // n1.behaviors.actuator = true
  // const nodes = [n1, n2]

  const bodies = []
  const constraints = { pre: [], post: [] }

  //
  //
  for (const node of nodes) {
    const bod = body(node.pos, settings.radius, 0.01)
    bod.data = node.data
    bod.addFlag(BodyFlags.ORGANISM)
    bod.setDNA(node.dna)
    bodies.push(bod)

    let nEdges = node.edges.length
    for (const node2 of nodes) {
      if (node === node2) continue
      nEdges += node2.edges.filter((e) => e === node).length
    }

    // if (nEdges === 1) {
    //   bod.color = "yellow"
    //   constraints.pre.push(new FoodSeeker(bod, world), new Eater(bod, world))
    // }

    // for (const [name, enabled] of Object.entries(node.behaviors)) {
    //   if (!enabled) continue
    //   constraints.pre.push(new behaviors[name](bod, world))
    // }

    for (const [name, enabled] of Object.entries(node.sensors)) {
      if (!enabled) continue
      const Sens = Sensors[name]
      if (!Sens) continue
      new Sens(bod, world)
    }
  }

  const food = []
  for (let i = 0; i < 100; i++) {
    food.push(
      new Food(vec2($fx.rand(), $fx.rand()), (fd) =>
        food.splice(food.indexOf(fd), 1)
      )
    )
  }

  // for (let i = 0; i < min(5, bodies.length); i++) {
  //   const idx = rnd.int(0, bodies.length)
  //   new VisionSensor(bodies[idx], world)
  // }
  // for (let i = 0; i < min(5, bodies.length); i++) {
  //   const idx = rnd.int(0, bodies.length)
  //   new SmellSensor(bodies[idx], world)
  // }
  // for (let i = 0; i < min(5, bodies.length); i++) {
  //   const idx = rnd.int(0, bodies.length)
  //   new ClockSensor(bodies[idx], world)
  // }

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
  const NB = 20
  for (let i = 0; i < NB; i++) {
    for (let j = 0; j < NB; j++) {
      const bod = body(
        vec2((i + 0.5) / NB, (j + 0.5) / NB),
        settings.radius * 0.4,
        0.02
      )
      bod.addFlag(BodyFlags.REPELLING | BodyFlags.REPELLED)
      testBodies.push(bod)
    }
  }

  const allBodies = [...food, ...testBodies, ...bodies]

  // constraints.pre.push(new Clusters(bodies, clusterRules, settings.clusters.nb))
  constraints.pre.push(
    new GlobalRepulsion(allBodies, {
      radius: 0.05,
      strength: 0.0003,
    })
  )
  // constraints.pre.push(
  //   new LAR(
  //     bodies.filter((body) => body.hasFlag(BodyFlags.FOOD_SEEKER)),
  //     food,
  //     {
  //       attr: larf(0.2, 0.05),
  //       rep: larf(0, 0),
  //     }
  //   )
  // )
  constraints.post.push(new Collisions(allBodies))
  constraints.post.push(new SquareBounds(allBodies))

  world.setBodies(allBodies)
  const solver = new Solver(world, constraints)

  const selection = new NodeSelection(world)
  window.selection = selection

  const renderer = new CanvasRenderer([allBodies, constraints.pre, [selection]])
  Mouse.init(renderer.cvs)

  const $g1 = document.createElement("div")
  document.body.appendChild($g1)
  $g1.style.width = "300px"
  $g1.style.height = "120px"
  const g1 = new Graph($g1, {
    def: [
      {
        name: "token-chem0",
        color: "#ff0000",
        min: 0,
        max: 4,
      },
      {
        name: "token-chem1",
        color: "#ffff00",
        min: 0,
        max: 4,
      },
      {
        name: "token-chem2",
        color: "#00ff00",
        min: 0,
        max: 4,
      },
      {
        name: "token-chem3",
        color: "#0000ff",
        min: 0,
        max: 4,
      },
    ],
    get: () => {
      // what do we want To graph ?
      // - tokens received
      // - actions taken by CPU update

      return selection.selected.signals.map((s) => clamp(s, 0, 16))
    },
  })

  // todo
  // graph 2 doesn't work!
  const $g2 = document.createElement("div")
  document.body.appendChild($g2)
  $g2.style.width = "300px"
  $g2.style.height = "120px"
  const g2 = new StackGraph($g2, {
    def: [
      {
        name: "actuator chem 0",
        color: `rgba(255,0,0,0.25)`,
        min: 0,
        max: 1,
      },
      {
        name: "actuator chem 1",
        color: `rgba(255,0,0,0.5)`,
        min: 0,
        max: 1,
      },
      {
        name: "actuator chem 2",
        color: `rgba(255,0,0,0.75)`,
        min: 0,
        max: 1,
      },
      {
        name: "actuator chem 3",
        color: `rgba(255,0,0,1)`,
        min: 0,
        max: 1,
      },
    ],
    get: () => {
      return selection.selected.operations.map((ops) =>
        ops.some((op) => op.name === "actuate") ? 1 : 0
      )
    },
  })

  function tick(t, dt) {
    world.update()

    solver.prepare(t, dt)
    g1.tick()
    g2.tick()
    solver.solve(t, dt)

    renderer.render()
    g1.draw()
    g2.draw()
  }

  let time,
    lastTime = performance.now(),
    dt
  function loop() {
    stats.begin()
    time = performance.now()
    dt = min(time - lastTime, 30) / 1000
    lastTime = time
    tick(time, dt)
    requestAnimationFrame(loop)
    stats.end()
  }
  loop()
}
start()
