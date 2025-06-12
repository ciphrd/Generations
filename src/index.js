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
// [ ] Support deleting entities from the world, and have everything handling
//     it elegantly (ex: eating food should make the food disappear)

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

// todo: coloring
// (x) colors are handled by the DNA
//     (x) add OP to define colors (8 bits for color)
//         note: clamp bits if end of DNA ?
//     (x) color assigned to cell
// (x) color rendering
//     (x) cells are colored based on instance color
//     (x) smooth transitions between cells (HARD — re: no lol)
//     (x) improve coloration as a whole
//         (x) function to get variations of base color
//         (x) add these variations everywhere
// (x) sediments
//     (x) improve coloring of sediments, rn pretty bad
//     (x) too regular: maybe change rules with some noise

//! Scoping the final phase of the project
// ( ) base requirements
//     ( ) work on evolutions extensively and make sure it's interesting to
//         evolve certain organisms (low but existing variance)
//     ( ) more seed DNAs for a bit more variety
//     ( ) parametrize the different noises with a seed (as well as the various
//         color settings such as microscope light, etc)
//     ( ) render
//         (x) food, other cells, temp liaisons
//         (x) they should too interact with env.
//         ( ) cell activations
//             small color flashes ?
//         ( ) a bit of env variations (subtle noisy patterns, dust)
//         ( ) extra post-processing
//             microscope lens ? kinda signature yk
//             chromatic abberation
//         ( ) handle pixel ratio dependant rendering (shouldn't depend on PR)
//         ( ) perform gaussian blur on color field in a different color space
//             get more natural blended colors
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
//     ( ) rename rnd to rng

// todo: cell deformations
// Right now only the liaisons are deformed, which creates some un-orgnanic
// feel to the whole, as cells are never deformed
// ( ) investigate how cells could get deformed
// ( ) implement cell deformations
// ( ) hope for the best

// todo:
// Think about visual variations. Color won't be enough, their should be other
// properties. Some ideas:
// - membranes are different
// - cells are smaller
// - other microscopy techniques ?
// - add other kinds of rendering ?
//   - fish-egg kind of rendering
//   - only membranes ?
// -

// todo: mutations
// for open-form
// ( ) initial DNA definition based on first hash
// ( ) add mutations to the DNA based on the list of following hashes

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
  Mouse.init(renderer.cvs)

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
