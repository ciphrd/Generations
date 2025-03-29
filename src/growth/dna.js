import { execFunctions } from "../graph/rule"
import { behaviors, settings } from "../settings"
import { rnd } from "../utils/rnd"
import { str } from "../utils/string"

/**
 * Do we encode growth rules using some kind of ByteCode ?
 * To remain in the spirit of behaviour encoding, and facilitate mutations, we
 * probably should. Though it's unclear if mutations could have negative effects
 * on the growth as some operations are more complexe (require specific
 * parameters for instance). So maybe for mutating we apply a more conservative
 * approach and alter the function graph instead.
 *
 * Functions to encode:
 * - permut( rule )
 * - assign( letter, dna )
 * - dna( number )
 * - gt( number, number )
 * - lt( number, number )
 * - either( any, any, boolean )
 * - rnd( )
 * (
 * - rnd_behavior
 * - rnd_dna
 * - ...
 * )
 *
 * Typed Stack Based Bytecode, with automatic typecast to avoid mutation
 * failures.
 *
 * Types:
 * - number
 * - boolean
 * - letter
 * - dna
 *
 * Functions should be resilient, as in never fail even if the provided input
 * isn't proper. It should resolve with the closest solution.
 */

const rulesContructionGraph = [
  ["root_fns", "assign", 34],
  ["root_fns", "cluster", 33],
  ["root_fns", "behavior", 33],

  // types mapping
  ["number", "_rnd", 80],
  ["number", "either<number>", 20],
  ["boolean", "_boolean", 60],
  ["boolean", "gt", 40],

  ["permut", "_rule", 100],

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

export function createDna(settings) {
  const { permutations, propsRange } = settings
  const permutRule = generateWithGraph("permut", permutations, settings)
  const cleanedRule = /{{(.+)}}/.exec(permutRule.replace("->", ""))[1]
  const nProps = rnd.int(propsRange.min, propsRange.max)
  const props = [...Array(nProps)].map(() =>
    generateWithGraph(
      "root_fns",
      permutations,
      settings,
      str.letters(cleanedRule).join("")
    )
  )
  return [permutRule, ...props].join(";")
}

export function createDnas(nb, settings) {
  return [...Array(nb)].map(() =>
    createDna({
      ...settings,
      nDNAs: nb,
    })
  )
}

function generateDNA(settings) {
  const { seeds } = settings
  console.log({ seeds })
  const bytes = []

  // all dns start with a permutation rule
  bytes.push(0x1)
  bytes.push(...rnd.el(seeds))
  // marks the end of permutation
  bytes.push(128)

  for (let i = 0, m = rnd.int(10, 30); i < m; i++) {
    bytes.push(rnd.int(0, 256) & 0xff)
    // if ($fx.rand() < 0.1) {
    //   bytes.push(((0xc << 4) + rnd.int(0, 16)) & 0xf)
    // }
  }

  return new Uint8Array(bytes)
}

export function generateDNAs(settings) {
  return [...Array(16)].map(() => generateDNA(settings))
}
