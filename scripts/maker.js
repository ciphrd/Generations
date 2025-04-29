import fs from "node:fs"
import path from "node:path"
import { compile, encode } from "./activations.js"

const ROOT = path.join(import.meta.dirname, "..")
const OUTPUT_PATH = path.join(ROOT, "src", "maker.json")

const NOP = `nop_0`

const BASE_TEST = [
  {
    pos: [0.5, 0.5],
    edges: [1, 2],
    dnas: [
      `
        rot
        push 0.02
        add
        swp         
        pop
        swp
        pop
        dup
        push 1
        swp
        mod
        swp         
        pop
        swp
        pop
        push 1
        dup
        add
        swp
        pop
        swp
        pop
        mul
        push 1
        swp
        sub
        swp
        pop
        swp
        pop
        swp
        pop
        swp
        pop
        swp
        rot
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
    sensors: {
      clock: {
        amplitude: 0.5,
        frequency: 1,
      },
    },
  },

  {
    pos: [0.52, 0.52],
    edges: [0, 2],
    dnas: [
      `
      fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
    sensors: {
      clock: {
        amplitude: 0.5,
        frequency: 1,
      },
    },
  },

  {
    pos: [0.48, 0.48],
    edges: [0, 1],
    dnas: [
      `
        fire_0
        act
      `,
      NOP,
      NOP,
      NOP,
    ],
  },

  {
    pos: [0.43, 0.43],
    edges: [0, 2],
    dnas: [
      `
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },

  {
    pos: [0.46, 0.52],
    edges: [3],
    dnas: [
      `
        push 1
        push 0
        sub
        swp
        pop
        swp
        pop
        mul
        swp
        pop
        swp
        pop
        fire_0
      `,
      NOP,
      NOP,
      NOP,
      NOP,
    ],
  },

  {
    pos: [0.46, 0.54],
    edges: [4],
    dnas: [
      `
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },

  {
    pos: [0.46, 0.56],
    edges: [5],
    dnas: [
      `
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },
]

const ONE_BODY_EMIT_SIN_WAVE = [
  {
    pos: [0.5, 0.5],
    edges: [1],
    dnas: [
      `
        rot
        push 0.01
        add
        swp
        pop
        swp
        pop
        dup
        cos
        swp
        pop
        swp
        rot
        swp
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },

  {
    pos: [0.52, 0.52],
    edges: [0],
    dnas: [
      `
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },
]

const ONE_EMIT_SIN_LINE_REPLICATORS = [
  {
    pos: [0.5, 0.5],
    edges: [1],
    dnas: [
      `
        rot
        push 0.01
        add
        swp
        pop
        swp
        pop
        dup
        cos
        swp
        pop
        swp
        rot
        swp
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },

  {
    pos: [0.53, 0.52],
    edges: [0, 2],
    dnas: [
      `
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },

  {
    pos: [0.54, 0.52],
    edges: [1, 3],
    dnas: [
      `
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },

  {
    pos: [0.56, 0.52],
    edges: [2, 4],
    dnas: [
      `
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },

  {
    pos: [0.58, 0.52],
    edges: [3, 5],
    dnas: [
      `
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },

  {
    pos: [0.6, 0.52],
    edges: [4, 6],
    dnas: [
      `
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },

  {
    pos: [0.62, 0.52],
    edges: [5, 7],
    dnas: [
      `
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },

  {
    pos: [0.64, 0.52],
    edges: [6, 8],
    dnas: [
      `
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },

  {
    pos: [0.66, 0.52],
    edges: [7],
    dnas: [
      `
        fire_0
      `,
      NOP,
      NOP,
      NOP,
    ],
  },
]

const EXPORT = ONE_EMIT_SIN_LINE_REPLICATORS

EXPORT.forEach((node) => {
  node.dnas = node.dnas.map((dna) => compile(dna))
  if (node.sensors?.clock) {
    const freqU8 =
      (((node.sensors.clock.frequency - 0.2) / (3 - 0.2)) * 255) & 0xff
    const ampU8 = (((node.sensors.clock.amplitude + 1) / 2) * 255) & 0xff
    node.sensors.clock = (freqU8 << 8) + ampU8
  }
})
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(EXPORT))
