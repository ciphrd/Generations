/**
 * Project inspirations
 * - Stephen Worlfram Physics project
 * - ALIEN simulation
 * - https://en.wikipedia.org/wiki/Hebbian_theory
 * - Petri-Nets
 */

import "./inject.js"

import { Body, BodyFlags } from "./physics/body"
import { Spring } from "./physics/constraints/spring"
import { CanvasRenderer } from "./renderer/canvas/renderer"
import { vec2 } from "./utils/vec"
import { Food } from "./physics/entities/food"
import { GlobalRepulsion } from "./physics/constraints/repulsion"
import { nodeTupleId } from "./graph/node"
import { Collisions } from "./physics/constraints/collisions"
import { World } from "./physics/world"
import { Solver } from "./physics/solver"
import { settings } from "./settings"
import { grow } from "./growth/growth"
import { getSeeds } from "./opti/seeds"
import { Sensors } from "./sensors"
import { NodeSelection } from "./interactions/selection"
import { dnahex } from "./utils/string"
import { Ticker } from "./engine/ticker"
import { Engine } from "./engine/engine"
import { WebGLRenderer } from "./renderer/webgl/renderer"
import { Controls } from "./controls"
import { Params, generateParameters } from "./parametric-space.js"
import { defineFeatures } from "./utils/features.js"
import { Mouse } from "./interactions/mouse.js"

//! very last todo
// (x) double check if growth works properly
//     (x) potentially fix mutations on growth which tend to yield completely
//         different results / break
// (x) parametrize the different noises with a seed (as well as the various
//     color settings such as microscope light, etc): general pre-processing
//     solution with a variable maybe ?
// (x) look at current signaling solution and check what can be simplified
//     so that it works in a smoother way. right now not so great
//     (x) have a single signal instead of 4. simpler is all ways
// (x) cleanup rendering
//     tend towards color crispiness, clean
// (-) add signal rendering (single signal much easier, there can be 2 colors
//     one for negative and one for positive, or just single color even)
// (x) clean up code as much as possible
//     (x) go through shaders
//     (x) go through JS implementation (tackle todos potentially)
//     (x) rename rnd to rng
//     (x) cleanup initialization, all in index is dirty rn
//     (x) cleanup bytecode instructions, too many rn
//     (x) todos
//     (x) only a single CPU needed now
// (-) optimisation pass: what can be optimzed ?
//     (-) budget different app areas and optimize the slow ones
// (x) finalize parameters and growth
//     (x) parametrize number of nodes
// (x) bugs
//     (x) colors not normalized
//     (x) viewport panning out of bounds
//     (x) subarray not a fn
// ( ) captures
//     (x) implement fast capture using canvas as a fallback renderer
//     ( ) check if capture works on fxhash
// (x) add features
// (x) remove Metrics / stats
// (x) remove UI
// ( ) if time
//     ( ) add mutation rate (hard coded at gen0)
//     (-) decrease nb of DNAs, as it results in very different generations
//         experiment with a single DNA ? -> too monotonous ?
// ( ) work on final bundling
//     ( ) many files are included
// (x) fix mobile

async function start() {
  const seeds = await getSeeds()
  generateParameters(seeds)
  defineFeatures()

  const world = new World()

  const nodes = grow(vec2(0.501, 0.502), Params.dnas, Params.nbCells)
  const dnahexes = {}
  nodes.forEach((node) => {
    const hex = dnahex(node.dna)
    if (!dnahexes[hex]) dnahexes[hex] = 0
    dnahexes[hex]++
  })

  const bodies = []
  const allBodies = []
  const constraints = { pre: [], post: [] }

  //
  //
  for (const node of nodes) {
    const bod = new Body(world, node.pos, settings.radius, 0.01, node.color)
    bod.data = node.data
    bod.addFlag(BodyFlags.ORGANISM | BodyFlags.BINDABLE)
    bod.setDNA(node.dna)
    bodies.push(bod)

    let nEdges = node.edges.length
    for (const node2 of nodes) {
      if (node === node2) continue
      nEdges += node2.edges.filter((e) => e === node).length
    }

    for (const [name, value] of Object.entries(node.sensors)) {
      const Sens = Sensors[name]
      if (!Sens) continue
      new Sens(bod, world, value)
    }
  }

  const food = []
  for (let i = 0; i < 100; i++) {
    food.push(
      new Food(
        world,
        vec2(
          Params.poolRngSequence.one() * 0.99,
          Params.poolRngSequence.one() * 0.99
        ),
        (fd) => world.removeBody(fd)
      )
    )
  }

  const edgemap = {}
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    for (const edge of node.edges) {
      if (node === edge) continue
      if (edgemap[nodeTupleId([node, edge])]) continue
      edgemap[nodeTupleId([node, edge])] = true
      constraints.pre.push(
        new Spring(
          bodies[i],
          bodies[nodes.indexOf(edge)],
          0.02,
          100,
          5,
          node.edgeColors || node.color.clone()
        )
      )
    }
  }

  bodies.forEach((body) => {
    body.addFlag(BodyFlags.REPELLING | BodyFlags.REPELLED)
  })

  const testBodies = []
  const NB = 0
  for (let i = 0; i < NB; i++) {
    for (let j = 0; j < NB; j++) {
      const bod = new Body(
        world,
        vec2((i + 0.5) / NB, (j + 0.5) / NB),
        settings.radius * 0.4,
        0.02
      )
      bod.addFlag(BodyFlags.REPELLING | BodyFlags.REPELLED | BodyFlags.BACTERIA)
      testBodies.push(bod)
    }
  }

  allBodies.push(...food, ...testBodies, ...bodies)

  constraints.pre.push(
    new GlobalRepulsion(world, {
      radius: 0.05,
      strength: 0.0002,
    })
  )

  world.setBodies(allBodies)

  constraints.post.push(new Collisions(world))

  world.setConstraints(constraints)

  const solver = new Solver(world)
  const ticker = new Ticker(8.333)

  const selection = new NodeSelection(world)
  window.selection = selection

  const Renderer =
    new URLSearchParams(window.location.search).get("engine") === "canvas"
      ? CanvasRenderer
      : WebGLRenderer

  const renderer = new Renderer(world, selection)

  const engine = new Engine({
    world,
    solver,
    selection,
    ticker,
    renderer,
  })

  engine.provideRenderingContainer(document.querySelector("body"))
  Controls.init(world)
  Mouse.init(document.querySelector("canvas#sim"))

  if ($fx.context.includes("capture")) {
    const steps = $fx.context === "fast-capture" ? 60 : 150

    if ($fx.context === "fast-capture") {
      engine.rendering = false
      const el = document.createElement("div")
      el.id = "temp"
      el.innerText = `temporary preview`
      document.body.append(el)
    }

    engine.ticker.running = true
    for (let i = 0; i < steps; i++) {
      engine.ticker.tick()
    }

    // render on the last tick
    engine.rendering = true
    engine.ticker.tick()

    $fx.preview()
    return
  } else {
    engine.start()
  }
}
start()
