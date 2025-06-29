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
 * - Clusters Jeffrey Ventrella
 * - https://en.wikipedia.org/wiki/Hebbian_theory
 * - Petri-Nets
 */

import "./inject.js"
// import { parametricSpace } from "./parametric-space.js"

import Stats from "stats.js"
import { BodyFlags, body } from "./physics/body"
import { Spring } from "./physics/constraints/spring"
import { CanvasRenderer } from "./renderer/canvas/renderer"
import { vec2 } from "./utils/vec"
import { larf } from "./physics/constraints/lar"
import { Food } from "./physics/entities/food"
import { fract } from "./utils/math"
import { Mouse } from "./interactions/mouse"
import { GlobalRepulsion } from "./physics/constraints/repulsion"
import { nodeTupleId } from "./graph/node"
import { rnd0 } from "./utils/rnd"
import { Collisions } from "./physics/constraints/collisions"
import { World } from "./physics/world"
import { Solver } from "./physics/solver"
import { settings } from "./settings"
import { grow } from "./growth/growth"
import { getSeeds } from "./opti/seeds"
import { Sensors } from "./sensors"
import { NodeSelection } from "./interactions/selection"
import { dnahex } from "./utils/string"
import { ui } from "./ui/index.jsx"
import { Ticker } from "./engine/ticker"
import { Engine } from "./engine/engine"
import { WebGLRenderer } from "./renderer/webgl/renderer"
import { Controls } from "./controls"
import { Params, generateParameters } from "./parametric-space.js"
import { generateDNAs } from "./growth/dna.js"

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
// ( ) look at current signaling solution and check what can be simplified
//     so that it works in a smoother way. right now not so great
//     ( ) have a single signal instead of 4. simpler is all ways
// ( ) cleanup rendering
//     tend towards color crispiness, clean
// ( ) add signal rendering (single signal much easier, there can be 2 colors
//     one for negative and one for positive, or just single color even)
// ( ) clean up code as much as possible
//     ( ) go through shaders
//     ( ) go through JS implementation (tackle todos potentially)
//     ( ) rename rnd to rng
//     ( ) cleanup initialization, all in index is dirty rn
// ( ) optimisation pass: what can be optimzed ?
//     ( ) budget different app areas and optimize the slow ones
// ( ) finalize parameters and growth
//     ( ) parametrize number of nodes
// ( ) captures
//     ( ) implement fast capture
//     ( ) check if capture works on fxhash
// ( ) add features
// ( ) work on final bundling
// ( ) remove UI

//! Scoping the final phase of the project
// ( ) base requirements
//     ( ) work on evolutions extensively and make sure it's interesting to
//         evolve certain organisms (low but existing variance)
//     ( ) more seed DNAs for a bit more variety
//     (x) parametrize the different noises
//     ( ) rework the signals to a much simpler state (with Clock, etc...)
//         it was less open-ended but maybe that's for the best
//     ( ) render
//         (x) food, other cells, temp liaisons
//         (x) they should too interact with env.
//         ( ) cell activations
//             small color flashes ?
//         ( ) a bit of env variations (subtle noisy patterns, dust)
//         ( ) extra post-processing
//             microscope lens ? kinda signature yk
//             chromatic abberation
//         ( ) responsive output (no microscope lens)
//         ( ) handle pixel ratio dependant rendering (shouldn't depend on PR)
//         ( ) perform gaussian blur on color field in a different color space
//             get more natural blended colors
//         ( ) optimize cells field rendering (probably only need 1 texture
//             output)
//         ( ) optimize: maybe now we can transfer world field cells to view
//             cells instead of re-rendering ?
//             if so is there even a need to do so or can we use invTx() ?
//     ( ) fix bugs
//         ( ) Unknown promise rejection reason
//             ooxEXWZrKip6H71hEnxvfnWZkh5G9iudmy3FC9XKxg41HvneufY
//         ( ) isNaN on position
//             oohnPj3cAUVfAVUiLvuCXqUG5HbD1RBCLfTkJJD2bPyAYSvqj3e
//         ( ) Temp liaisons are flashing
//             ooqcMLZVwx9j2TXpVt74ZmRMA1dAbydYrosJUjHHQx8K3cq4UgK
// ( ) extra
//     ( ) other microscopy techniques
//         ( ) general framework for allowing other techniques
//             essentially each light absorption layer has support for all
//             techniques as each technique as specific requirements
//         ( ) phase-contrast
//         ( ) fluoresence
//         ( ) fluoresence with colored bg
//     ( ) think about whether the UI is included or not
//         ( ) if so, think about what's missing from the UI
//

// todo: bugfux
// ( ) Unknown promise rejection reason
//     ooxEXWZrKip6H71hEnxvfnWZkh5G9iudmy3FC9XKxg41HvneufY
// ( ) isNaN on position
//     oohnPj3cAUVfAVUiLvuCXqUG5HbD1RBCLfTkJJD2bPyAYSvqj3e

async function start() {
  const seeds = await getSeeds()
  generateParameters(seeds)

  const world = new World()

  const nodes = grow(vec2(0.501, 0.502), Params.dnas, Params.nbCells)
  console.log({ nodes })
  const dnahexes = {}
  nodes.forEach((node) => {
    const hex = dnahex(node.dna)
    if (!dnahexes[hex]) dnahexes[hex] = 0
    dnahexes[hex]++
  })
  console.log(dnahexes)
  console.log(nodes)
  // throw null

  // const nodes = importNetwork(made)
  // console.log(nodes)
  // throw null

  const bodies = []
  const allBodies = []
  const constraints = { pre: [], post: [] }

  //
  //
  for (const node of nodes) {
    const bod = body(world, node.pos, settings.radius, 0.01, node.color)
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
        (fd) => {
          console.log("eaten !!!")
          world.removeBody(fd)
        }
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

  // const clusterRules = Array(settings.clusters.nb ** 2)
  // for (let i = 0; i < clusterRules.length; i++) {
  //   clusterRules[i] = {
  //     attr: larf(
  //       rnd0.range(
  //         settings.clusters.attr.range.min,
  //         settings.clusters.attr.range.max
  //       ),
  //       rnd0.range(
  //         settings.clusters.attr.strength.min,
  //         settings.clusters.attr.strength.max
  //       )
  //     ),
  //     rep: larf(
  //       rnd0.range(
  //         settings.clusters.rep.range.min,
  //         settings.clusters.rep.range.max
  //       ) * (fract(sqrt(i)) === 0 ? 0.02 : 1),
  //       rnd0.range(
  //         settings.clusters.rep.strength.min,
  //         settings.clusters.rep.strength.max
  //       )
  //     ),
  //   }
  // }

  // todo: clusters, maybe just remove ?
  // console.log({ clusterRules })
  bodies.forEach((body) => {
    // body.color = settings.clusters.colors[body.data.clusterGroup]
    body.addFlag(BodyFlags.REPELLING | BodyFlags.REPELLED | BodyFlags.DEBUG)
  })

  const testBodies = []
  const NB = 0
  for (let i = 0; i < NB; i++) {
    for (let j = 0; j < NB; j++) {
      const bod = body(
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

  // constraints.pre.push(new Clusters(bodies, clusterRules, settings.clusters.nb))
  constraints.pre.push(
    new GlobalRepulsion(world, {
      radius: 0.05,
      strength: 0.0002,
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

  console.log("---")
  console.log(engine.world)

  ui(engine)
}
start()
