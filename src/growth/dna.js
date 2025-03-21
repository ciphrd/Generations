import { execFunctions } from "../graph/rule"
import { behaviors, settings } from "../settings"
import { rnd } from "../utils/rnd"
import { str } from "../utils/string"

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
