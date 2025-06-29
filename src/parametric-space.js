/**
 * Handles the parametric space controlled by seeds. The only source of
 * randomness manipulation for primary-properties.
 */

import { generateDNA, mutateDNA } from "./growth/dna"
import { arr } from "./utils/array"
import { Color } from "./utils/color"
import { clamp, clamp01, fract, remap01 } from "./utils/math"
import { rnd, rnd0, rngSequence } from "./utils/rnd"

/**
 * will be populated by parametricSpace()
 * @type {ReturnType<typeof parametricSpace>}
 */
export const Params = {}

// rand({
//   // here goes the initial value
//   initial: (rnd) => rnd.one(),
//   // for values mapped using a non-linear function, it might be best to work
//   // with 2 values at all time, x and y. This framework always manipulates x,
//   // but will eventually return y (the derivative)
//   derive: (v) => x**2,
//   // is called at each depth
//   mutate: (prev, rnd, depth) => prev + 0,
//   // optional: used to enforce value within bounds at all times
//   bounds: (v) => clamp(v, 0.2, 1.0),
// })

const noop = (v) => v
function randMutate({ initial, mutate, output }) {
  output = output || noop

  let value = initial(rnd(0))
  for (let i = 1; i <= $fx.depth; i++) {
    value = mutate(value, rnd(i), i)
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
      // todo: figure out the exact number here
      const rng = rngSequence(arr.new(10_000, () => rnd0.one()))
      return arr.new(16, () => generateDNA(seeds, rng))
    },
    mutate: (prev, rngAtDepth) => {
      // todo: same as above
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
    initial: (rng) => rng.range(70, 120),
    mutate: (prev, rng) => clamp(prev + rng.range(-10, 20), 10, 800),
  })

  // coloring
  const cellsDefaultColor = randMutate({
    initial: (rnd) => arr.new(3, () => rnd.range(0.5, 1.0)),
    mutate: (prev, rnd) => prev.map((v) => v + rnd.range(-0.1, 0.1)),
    output: (val) => new Color(...val.map((c) => clamp01(c))),
  })

  // todo: right now output is same range as initial, would be interesting
  //       to allow out-of-bounds exploration

  const sedimentHues = randMutate({
    initial: (rnd) => arr.new(2, () => rnd.one()),
    mutate: (prev, rnd) => prev.map((v) => v + rnd.range(-0.05, 0.05)),
    output: (vals) => vals.map((v) => fract(v)),
  })

  const sedimentSharpness = randMutate({
    initial: (rnd) => rnd.range(0.1, 0.5),
    mutate: (prev, rnd) => prev + rnd.range(-0.03, 0.03),
    output: (v) => clamp(v, 0.1, 0.5),
  })

  const sedimentBgThickness = randMutate({
    initial: (rnd) => rnd.range(0.9, 3.5),
    mutate: (prev, rnd) => prev + rnd.range(-0.1, 0.1),
    output: (v) => clamp(v, 0.9, 3.5),
  })

  const sedimentFgThickness = randMutate({
    initial: (rnd) => rnd.range(0.5, 1.0),
    mutate: (prev, rnd) => prev + rnd.range(-0.04, 0.04),
    output: (v) => clamp(v, 0.5, 1.0),
  })

  const sedimentNbAgents = randMutate({
    initial: (rnd) => rnd.range(16, 128),
    mutate: (prev, rnd) => prev + rnd.range(-10, 10),
    output: (v) => floor(clamp(v, 16, 128)),
  })

  const rdDiffRateB = randMutate({
    initial: (rnd) => rnd.range(0.3, 1.0),
    mutate: (prev, rnd) => clamp(prev + rnd.range(-0.1, 0.1), 0.3, 1.0),
  })

  const cellsBgSeparation = randMutate({
    initial: (rnd) => rnd.range(0.0, 0.03),
    mutate: (prev, rnd) => rnd.range(0.0, 0.03),
  })

  const rdGaussianFilterSize = randMutate({
    initial: (rnd) => 3 + round(rnd.one()) * 2, // 3 or 5
    mutate: (prev, rnd) => 3 + round(rnd.one()) * 2,
  })

  const substrateAgentsRndMove = randMutate({
    initial: (rnd) => rnd.range(0.1, 0.3),
    mutate: (prev, rnd) => clamp(prev + rnd.range(-0.02, 0.02), 0.01, 0.3),
    output: (v) => clamp(v, 0.01, 0.3),
  })

  const substrateAgentsMoveSpeed = randMutate({
    initial: (rnd) => rnd.range(0.001, 0.005),
    mutate: (prev, rnd) => clamp(prev + rnd.range(-0.001, 0.001), 0.001, 0.03),
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
    output: (v) => remap01(v, 0, 0.1),
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
  }
}

export function generateParameters(seeds) {
  const generated = parametricSpace(seeds)
  Object.assign(Params, generated)
}
