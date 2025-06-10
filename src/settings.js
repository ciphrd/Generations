import { Actuator } from "./interactions/actuator"
import { Anchor } from "./interactions/anchor"
import { Eater } from "./interactions/eat"
import { FoodSeeker } from "./interactions/food-seeker"
import { Params } from "./parametric-space"
import { Color } from "./utils/color"
import { rnd, rnd0 } from "./utils/rnd"

export const settings = {
  radius: 0.006,
  rendering: {
    cell: {
      scale: 2.2,
    },
  },
  dnas: {
    nb: 10,
  },
  signals: {
    loss: 0.99,
  },
  cells: {
    default: {
      color: Params.cellsDefaultColor,
    },
  },
  food: {
    default: {
      color: new Color(0, 0, 255),
      radius: 0.02,
    },
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
  sediments: {
    nbRoot: Params.sedimentNbAgents,
    cellsSeparation: Params.cellsBgSeparation,
    hues: {
      substrate: Params.sedimentHues[0],
      rd: Params.sedimentHues[1],
    },
    sharpness: Params.sedimentSharpness,
    thickness: {
      bg: Params.sedimentBgThickness,
      fg: Params.sedimentFgThickness,
    },
    rd: {
      diffRateB: Params.rdDiffRateB,
    },
  },
  microscopy: {
    light: {
      backlightColor: new Color(1, 1, 1),
    },
  },
}

export const permutations = [
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

export const behaviors = {
  actuator: Actuator,
  anchor: Anchor,
  "food-seeker": FoodSeeker,
  eater: Eater,
}
