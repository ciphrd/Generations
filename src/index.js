// Nice seeds
// - ooQRoiuLxppVjdXLT8qeTsHq29QiXm9cFDxRKktHxKNHidHTKhD
// - ooqiGoeSg1AEZcVjrH7mTf1P3f3e5cbgE3DJYsKd1M33Yd9j1UA
//   grabber on food proximity + eater (nice working organism)
// - ooNDYieq77FrGqYJDLNoMe7K3eWJDq9YH7Dt4CJPr75LTiobaHR
//   (200)
//   nice food graber
// - ooEMgLs6iWBVTgtkaZ8Fpy4kBVM1LLx669GBFFf5PUcwBbe5TS4
//   devour
// -

/**
 * !DEBUG
 * - ooZFinCejNF6FdgLemP3BhmEQFMuAGPv9k7nEWaAJYzX4Si9UGR
 */

/**
 * Project inspirations
 * - Stephen Worlfram Physics project
 * - ALIEN simulation
 * - https://en.wikipedia.org/wiki/Hebbian_theory
 * - Petri-Nets
 */

import "./inject.js"

import Stats from "stats.js"
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

const stats = new Stats()
stats.showPanel(1)
stats.dom.style.position = "absolute"
stats.dom.style.left = "auto"
stats.dom.style.right = "0px" // Align to the right
stats.dom.style.top = "0px"
document.body.appendChild(stats.dom)

//! very last todo
// ( ) double check if growth works properly
//     ( ) potentially fix mutations on growth which tend to yield completely
//         different results / break
// (x) parametrize the different noises with a seed (as well as the various
//     color settings such as microscope light, etc): general pre-processing
//     solution with a variable maybe ?
// (x) look at current signaling solution and check what can be simplified
//     so that it works in a smoother way. right now not so great
//     (x) have a single signal instead of 4. simpler is all ways
// ( ) cleanup rendering
//     tend towards color crispiness, clean
// ( ) add signal rendering (single signal much easier, there can be 2 colors
//     one for negative and one for positive, or just single color even)
// ( ) clean up code as much as possible
//     ( ) go through shaders
//     ( ) go through JS implementation (tackle todos potentially)
//     ( ) rename rnd to rng
//     (x) cleanup initialization, all in index is dirty rn
//     ( ) cleanup bytecode instructions, too many rn
//     ( ) todos
//     (x) only a single CPU needed now
// ( ) optimisation pass: what can be optimzed ?
//     ( ) budget different app areas and optimize the slow ones
// ( ) finalize parameters and growth
//     (x) parametrize number of nodes
// ( ) captures
//     (x) implement fast capture
//     ( ) check if capture works on fxhash
// (x) add features
// ( ) remove Metrics
// (x) remove UI
// ( ) work on final bundling

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
    // todo: remove DEBUG flag
    body.addFlag(BodyFlags.REPELLING | BodyFlags.REPELLED | BodyFlags.DEBUG)
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
  const ticker = new Ticker(8.333, stats)

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

  Controls.init(world)

  engine.provideRenderingContainer(document.querySelector("body"))

  if ($fx.context.includes("capture")) {
    const steps = $fx.context === "fast-capture" ? 50 : 80
    engine.ticker.running = true
    for (let i = 0; i < steps; i++) {
      engine.ticker.tick()
    }
    $fx.preview()
  } else {
    engine.start()
  }
}
start()
