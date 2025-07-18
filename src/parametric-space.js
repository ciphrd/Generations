/**
 * Handles the parametric space controlled by seeds. The only source of
 * randomness manipulation for primary-properties.
 */

import { generateDNA, mutateDNA } from "./growth/dna"
import { arr } from "./utils/array"
import { Color } from "./utils/color"
import { clamp, clamp01, fract, remap01 } from "./utils/math"
import { rng, rng0, rngSequence } from "./utils/rng"

/**
 * will be populated by parametricSpace()
 * @type {ReturnType<typeof parametricSpace>}
 */
export const Params = {}

const noop = (v) => v
function randMutate({ initial, mutate, output }) {
  output = output || noop

  let value = initial(rng(0))
  for (let i = 1; i <= $fx.depth; i++) {
    value = mutate(value, rng(i), i)
  }

  return output(value)
}

// todo: we could add a "mutation strength" which drives how much mutation there
//       is. Then each mutation is factor of this strength.

function parametricSpace(seeds) {
  /**
   * @note It's important here to generate the most significant features first,
   * in case a new version would be pushed on-chain. This would allow keeping
   * these features even if more parameters are added in the param space.
   *
   * @note Because the generation process requires an arbitrary number of
   * random number generations (the number varies based on a random number
   * generated), a sequence of fixed length is pre-generated. This sequence is
   * designed to be 2x bigger than the theoretical maximum required, to ensure
   * future versions have some margin.
   */

  const dnas = randMutate({
    initial: () => {
      const rng = rngSequence(arr.new(10_000, () => rng0.one()))
      return arr.new(16, () => generateDNA(seeds, rng))
    },
    mutate: (prev, rngAtDepth) => {
      const rng = rngSequence(arr.new(10_000, () => rngAtDepth.one()))
      for (let i = 0; i < 16; i++) {
        prev[i] = mutateDNA(prev[i], rng /* todo: strength ? */)
      }
      return prev
    },
  })

  const growthRngSequence = randMutate({
    initial: (rng) => rngSequence(arr.new(10_000, rng.one)),
    mutate: (prev, rng) => prev,
  })
  const poolRngSequence = randMutate({
    initial: (rng) => rngSequence(arr.new(10_000, rng.one)),
    mutate: (prev, rng) => rngSequence(arr.new(10_000, rng.one)),
  })

  /**
   * From now on, these parameters are less significant. They are computed
   * from most to least important for the sake safety in case of version update
   * (though it shouldn't matter).
   */

  const nbCells = randMutate({
    initial: (rng) => rng.range(70, 180),
    mutate: (prev, rng) => clamp(prev + rng.range(-15, 22), 10, 800),
  })

  // coloring
  const cellsDefaultColor = randMutate({
    initial: (rng) => arr.new(3, () => rng.range(0.5, 1.0)),
    mutate: (prev, rng) => prev.map((v) => v + rng.range(-0.1, 0.1)),
    output: (val) => new Color(...val.map((c) => clamp01(c))),
  })

  const sedimentHues = randMutate({
    initial: (rng) => arr.new(2, () => rng.one()),
    mutate: (prev, rng) => prev.map((v) => v + rng.range(-0.05, 0.05)),
    output: (vals) => vals.map((v) => fract(v)),
  })

  const sedimentSharpness = randMutate({
    initial: (rng) => rng.range(0.1, 0.5),
    mutate: (prev, rng) => prev + rng.range(-0.03, 0.03),
    output: (v) => clamp(v, 0.1, 0.5),
  })

  const sedimentBgThickness = randMutate({
    initial: (rng) => rng.range(0.9, 3.5),
    mutate: (prev, rng) => prev + rng.range(-0.1, 0.1),
    output: (v) => clamp(v, 0.9, 3.5),
  })

  const sedimentFgThickness = randMutate({
    initial: (rng) => rng.range(0.5, 1.0),
    mutate: (prev, rng) => prev + rng.range(-0.04, 0.04),
    output: (v) => clamp(v, 0.5, 1.0),
  })

  const sedimentNbAgents = randMutate({
    initial: (rng) => rng.range(16, 64),
    mutate: (prev, rng) => prev + rng.range(-10, 10),
    output: (v) => floor(clamp(v, 16, 128)),
  })

  const rdDiffRateB = randMutate({
    initial: (rng) => rng.range(0.3, 1.0),
    mutate: (prev, rng) => clamp(prev + rng.range(-0.1, 0.1), 0.3, 1.0),
  })

  const cellsBgSeparation = randMutate({
    initial: (rng) => rng.range(0.0, 0.03),
    mutate: (prev, rng) => rng.range(0.0, 0.03),
  })

  const rdGaussianFilterSize = randMutate({
    initial: (rng) => 3 + round(rng.one()) * 2, // 3 or 5
    mutate: (prev, rng) => 3 + round(rng.one()) * 2,
  })

  const substrateAgentsRndMove = randMutate({
    initial: (rng) => rng.range(0.1, 0.3),
    mutate: (prev, rng) => clamp(prev + rng.range(-0.02, 0.02), 0.01, 0.3),
    output: (v) => clamp(v, 0.01, 0.3),
  })

  const substrateAgentsMoveSpeed = randMutate({
    initial: (rng) => rng.range(0.001, 0.005),
    mutate: (prev, rng) => clamp(prev + rng.range(-0.001, 0.001), 0.001, 0.03),
    output: (v) => clamp(v, 0.001, 0.03),
  })

  const cellsColorSpread = randMutate({
    initial: (rng) => rng.one(),
    mutate: (prev, rng) => clamp01(prev + rng.range(-0.13, 0.13)),
    output: (v) => remap01(v, 0.1, 0.4),
  })

  const rdEggsEffect = randMutate({
    initial: (rng) => pow(rng.one(), 2.0) * 0.5,
    mutate: (prev, rng) => clamp01(prev + rng.range(-0.1, 0.1)),
    output: (v) => remap01(v, 0, 0.05),
  })

  const snoiseSeed = randMutate({
    initial: (rng) => arr.new(3, () => rng.one()),
    mutate: (prev, rng) => arr.new(3, () => rng.one()),
    output: (v) => v.map((v) => v * 1000),
  })

  return {
    dnas,
    nbCells,
    growthRngSequence,
    poolRngSequence,
    cellsDefaultColor,
    cellsScale: randMutate({
      initial: (rng) => rng.range(1, 3),
      mutate: (prev, rng) => clamp(prev + rng.range(-0.2, 0.2), 1, 3),
      output: (v) => clamp(v, 1, 3),
    }),
    sedimentHues,
    sedimentSharpness,
    sedimentBgThickness,
    sedimentFgThickness,
    sedimentNbAgents,
    rdDiffRateB,
    cellsBgSeparation,
    rdGaussianFilterSize,
    substrateAgentsRndMove,
    substrateAgentsMoveSpeed,
    cellsColorSpread,
    rdEggsEffect,
    snoiseSeed,
    sobelStrength: randMutate({
      initial: (rng) => rng.range(0.6, 1.0),
      mutate: (prev, rng) => clamp(prev + rng.range(-0.15, 0.15), 0.6, 2.0),
    }),
  }
}

export function generateParameters(seeds) {
  const generated = parametricSpace(seeds)
  Object.assign(Params, generated)
}
