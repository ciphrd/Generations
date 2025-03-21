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
import { BodyFlags, body } from "./physics/body"
import { Spring } from "./physics/constraints/spring"
import { Friction } from "./physics/constraints/friction"
import { CanvasRenderer } from "./renderer/canvas/renderer"
// import { canvasRenderer } from "./renderer/canvas"
import { vec2 } from "./utils/vec"
import { LAR, larf } from "./physics/constraints/lar"
import { Food } from "./physics/entities/food"
import { fract, lerp } from "./utils/math"
import { Mouse } from "./interactions/mouse"
import { GlobalRepulsion } from "./physics/constraints/repulsion"
import { applyRule, execFunctions } from "./graph/rule"
import { Node, nodeTupleId } from "./graph/node"
import { Eater } from "./interactions/eat"
import { rnd } from "./utils/rnd"
import { Clusters } from "./physics/constraints/clusters"
import { str } from "./utils/string"
import { Collisions } from "./physics/constraints/collisions"
import { SquareBounds } from "./physics/constraints/bounds"
import { World } from "./physics/world"
import { Solver } from "./physics/solver"
import { Actuator } from "./interactions/actuator"
import { Anchor } from "./interactions/anchor"
import { FoodSeeker } from "./interactions/food-seeker"

Object.getOwnPropertyNames(Math).forEach((el) => (window[el] = Math[el]))
window.TAU = 2 * PI

export const settings = {
  radius: 0.005,
  dnas: {
    nb: 10,
  },
  clusters: {
    nb: 4,
    attr: {
      range: {
        min: 0.02,
        max: 0.1,
      },
      strength: {
        min: 0.0001,
        max: 0.0003,
      },
    },
    rep: {
      range: {
        min: 0.01,
        max: 0.06,
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
      "rgba(255,0,255,0.6)",
      "purple",
      "white",
    ],
  },
}

// todo
// - do not reinstanciate the space hash, clean it / update
// - square rules
//   "{{{x,y},{y,z},{z,w},{w,x}}->{{x,y},{y,z},{z,w},{w,x},{y,x},{z,y},{w,z},{x,w},{x,z},{y,w},{z,v},{v,u},{u,y},{v,y},{z,u}}}",
// - rules can apply behaviors to nodes
// - (Implement hypergraphs (an edge can link multiple nodes at once))
//   not sure it will yield great results, if we good good results from
//   previous steps that's fine.

const permutRules = [
  // small triangles, many loops
  "{{{x,y},{x,z},{x,w}}->{{v,u},{u,v},{v,t},{u,t},{t,v},{t,u},{v,y},{u,z},{t,w}}}",
  // fractal division into many extremieties, multiple extremieties per node
  "{{{x,y},{y,z}}->{{w,x},{x,w},{w,z},{x,v},{y,z}}}",
  // robust triangulated strings, algae
  "{{{x,y},{y,z},{z,w},{w,x}}->{{x,y},{z,w},{w,x},{y,v},{v,u},{u,z},{z,y},{y,u}}}",
  // robust triangluated bodies & strings
  "{{{x,y},{y,z},{z,w},{w,x}}->{{x,y},{y,x},{z,w},{w,z},{w,x},{x,w},{y,v},{v,y},{v,u},{u,v},{u,z},{z,u},{z,y},{y,z},{y,u},{u,y}}}",
  // fractal division into many extremities
  "{{{x,y}}->{{x,z},{z,w},{y,z}}}",
  // strings of hexagons
  "{{{x,y},{y,z},{z,w},{w,v},{v,x}}->{{x,y},{y,z},{z,w},{w,v},{v,x},{y,x},{u,y},{t,u},{s,t},{x,s}}}",
  // few loops, lots of string freedom
  "{{{x,y},{x,z}}->{{w,x},{w,x},{w,y},{v,x},{z,v}}}",
  // few big chunky dots, many interconnections
  "{{{x,y},{x,y}}->{{z,y},{z,y},{y,x},{x,z}}}",
  // few loops, mainly long strings
  "{{{x,y},{x,z},{x,w}}->{{v,u},{u,v},{v,y},{v,t},{y,t},{u,z},{w,v}}}",
  // big loops with smaller loops inside, quite cellular-like
  "{{{x,y},{x,z}}->{{y,y},{y,w},{x,w},{z,w}}}",
  // many small loops, triangular extremities
  "{{{x,y},{x,z}}->{{w,y},{w,v},{y,v},{v,z}}}",
  // many small loops
  "{{{x,y},{y,z}}->{{w,y},{y,w},{w,z},{x,w}}}",
  // ""
  "{{{x,y},{y,z}}->{{w,y},{y,w},{w,v},{w,x},{z,v}}}",
  // tighly connected leaves ?
  "{{{x,y},{y,z}}->{{x,y},{y,z},{z,w},{w,v},{v,x}}}",
  // hexagons with 2 sides connected
  "{{{x,y}}->{{x,y},{y,z},{z,w},{w,v},{v,x}}}",
  // strong triangular strands, not exclusively though
  "{{{x,y},{y,z},{z,w},{w,x}}->{{x,y},{y,z},{z,w},{w,x},{y,v},{v,u},{u,z},{z,y},{y,u}}}",
  // tighly connected clusters, with medium-sized strands
  "{{{x,y},{x,z},{x,w}}->{{v,y},{y,v},{v,z},{z,w},{w,y}}}",
  // triangular, dispersed clusters
  "{{{x,y}}->{{x,z},{x,z},{y,z},{y,z}}}",
  // long simple string
  "{{{x,y}}->{{x,z},{z,y}}}",
  // simple long string, growing * 2
  "{{{x,y}}->{{x,w},{w,v},{v,y}}}",
  // triangles/squares connected together
  "{{{x,y},{x,z}}->{{x,y},{x,z},{w,x},{v,z},{w,v},{u,x},{u,w}}}",
  // squares connected together
  "{{{x,y},{x,z}}->{{x,y},{x,z},{w,x},{v,z},{w,v}}}",
  // tightly-packed
  "{{{x,y},{x,z}}->{{x,y},{x,z},{w,x},{w,y}}}",
  // clusters, but with small-to-long strands
  "{{{x,y},{y,z}}->{{x,y},{y,w},{w,y},{z,x}}}",
  // long strands, very few branches
  "{{{x,y},{x,z}}->{{x,y},{y,z},{z,w}}}",
  // few loops with very long strands (cool)
  "{{{x,y},{x,z}}->{{x,w},{y,w},{z,w}}}",
  // tighyl packed but preserves big nested structure
  "{{{x,y},{x,z}}->{{x,y},{x,w},{y,w},{z,w}}}",
]

const behaviors = {
  actuator: Actuator,
  anchor: Anchor,
  "food-seeker": FoodSeeker,
  eater: Eater,
}

const rulesContructionGraph = [
  ["root_fns", "assign", 34],
  ["root_fns", "cluster", 33],
  ["root_fns", "behavior", 33],

  // types mapping
  ["number", "_rnd", 80],
  ["number", "either<number>", 20],
  ["boolean", "_boolean", 60],
  ["boolean", "gt", 40],
  // general utils
  //
  ["rule_index", "_rnd_rule_idx", 80],
  ["rule_index", "number", 20],

  ["permut", "_rule", 100],

  ["ref", "_rnd_dna_idx", 100],
  ["assign", "letter", "dna", 100],

  ["gt", "number", "number", 100],

  // letter
  ["letter", "_letter", 80], // hard-coded letter
  ["letter", "either<_letter>", 20],
  // either
  ["either<t>", "t", "t", "boolean", 100],
  // cluster
  ["cluster", "_letter", "_rnd_cluster_idx", 80],
  ["cluster", "_letter", "number", 20],
  // dna
  ["dna", "_rnd_dna_idx", 80],
  ["dna", "number", 20],

  // behaviors
  ["behavior", "_letter", "_rnd_behavior", 100],
]

function generateWithGraph(node, rules, options, letters) {
  const fns = {
    rnd: () => "rnd()",
    boolean: () => $fx.rand() < 0.5,
    rnd_rule_idx: () => rnd.int(0, rules.length),
    rule: () => rnd.el(rules),
    letter: () => rnd.char(letters),
    rnd_cluster_idx: () => rnd.int(0, settings.clusters.nb),
    rnd_dna_idx: () => rnd.int(0, options.nDNAs),
    rnd_behavior: () =>
      rnd.el(Object.keys(behaviors).flatMap((b) => [`+${b}`, `-${b}`])),
  }

  if (node.startsWith("_")) {
    const fn = fns[node.slice(1)]
    if (!fn) throw "invalid graph"
    return fn()
  }

  let fnName = node

  // handle template
  const matches = /^([a-z_]+)<([a-z_]+)>$/.exec(node)
  const templates = {}
  if (matches) {
    node = matches[1] + `<t>`
    fnName = matches[1]
    templates["t"] = matches[2]
  }

  const edges = rulesContructionGraph.filter(([node0]) => node0 === node)
  const edge = rnd.weighted(edges.map((edge) => [edge, edge.at(-1)]))

  const fn = edge[0]
  const params = edge.slice(1, -1).map((par) => templates[par] || par)

  if (execFunctions.includes(fnName)) {
    return `${fnName}(${params
      .map((par) => generateWithGraph(par, rules, options, letters))
      .join(",")})`
  } else {
    if (params.length > 1) throw `too many pars for non-existing fn ${fnName}`
    return generateWithGraph(params[0], rules, options, letters)
  }
}

function createDna(permutRules, settings) {
  const { nMinProps, propsRange } = settings
  const permutRule = generateWithGraph("permut", permutRules, settings)
  const cleanedRule = /{{(.+)}}/.exec(permutRule.replace("->", ""))[1]
  const nProps = rnd.int(propsRange.min, propsRange.max)
  const props = [...Array(nProps)].map(() =>
    generateWithGraph(
      "root_fns",
      permutRules,
      settings,
      str.letters(cleanedRule).join("")
    )
  )
  return [permutRule, ...props].join(";")
}

const world = new World()

const DNAs = [...Array(settings.dnas.nb)].map(() =>
  createDna(permutRules, {
    propsRange: {
      min: 5,
      max: 10,
    },
    nDNAs: settings.dnas.nb,
    nClusters: settings.clusters.nb,
  })
)
console.log("DNAs:")
for (const dna of DNAs) {
  console.log(dna)
}

const nodes = [new Node(vec2(0.501, 0.502), DNAs[0])]
nodes[0].edges.push(nodes[0])
nodes[0].edges.push(nodes[0])
nodes[0].edges.push(nodes[0])
nodes[0].edges.push(nodes[0])
for (const node of nodes) {
  node.data.clusterGroup = 0
  node.rule = rnd.el(DNAs)
}

const N = lerp(30, 350, pow($fx.rand(), 4))

for (let i = 0; i < 1000 && nodes.length < N; i++) {
  for (let L = nodes.length, j = L - 1; j >= 0 && nodes.length < N; j--) {
    // applyRule(nodes, nodes[j], rules)
    applyRule(nodes, rnd.el(nodes), DNAs)
  }
}

for (const node of nodes) {
  // console.log(`${node.id}->${node.edges.map((n) => n.id).join(",")}`)
  console.log(node.rule)
  // node.data.clusterGroup = DNAs.indexOf(node.rule)
}

let strEdges = []
for (const node of nodes) {
  for (const edge of node.edges) {
    strEdges.push(`${node.id} ${edge.id} 0`)
  }
}

const stats = new Stats()
stats.showPanel(1)
document.body.appendChild(stats.dom)

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
  bod.addFlag(BodyFlags.GLOBAL_REPULSION)
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

bodies.forEach((body) => body.addFlag(BodyFlags.GLOBAL_REPULSION))

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
  // body.data.clusterGroup = rnd.int(0, settings.clusters.nb)
  body.color = settings.clusters.colors[body.data.clusterGroup]
  body.addFlag(BodyFlags.REPELLING)
  body.addFlag(BodyFlags.REPELLED)
  body.addFlag(BodyFlags.DEBUG)
})

const testBodies = []
const NB = 25
for (let i = 0; i < NB; i++) {
  for (let j = 0; j < NB; j++) {
    const bod = body(
      vec2((i + 0.5) / NB, (j + 0.5) / NB),
      settings.radius * 0.4
    )
    bod.addFlag(BodyFlags.WANDERING)
    bod.addFlag(BodyFlags.GLOBAL_REPULSION)
    testBodies.push(bod)
    constraints.pre.push(new Friction(bod, 0.02))
  }
}
testBodies.forEach((body) =>
  body.addFlag(BodyFlags.REPELLING | BodyFlags.REPELLED)
)

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

const renderer = new CanvasRenderer([allBodies, constraints.pre])
Mouse.init(renderer.cvs)

world.setBodies(allBodies)
const solver = new Solver(world, constraints)

function tick(time, t, dt) {
  solver.solve(t, dt)
  renderer.render()
}

let lastFrameTime
function loop() {
  stats.begin()
  const time = performance.now()
  const dt = min(time - lastFrameTime, 30) / 1000
  lastFrameTime = time
  tick(time, time, dt)
  stats.end()
  requestAnimationFrame(loop)
}

function start() {
  lastFrameTime = performance.now()
  loop()
}
start()
