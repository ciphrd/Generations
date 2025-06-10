/**
 * Handles the parametric space controlled by seeds. The only source of
 * randomness manipulation for primary-properties.
 */

import { arr } from "./utils/array"
import { Color } from "./utils/color"
import { clamp, clamp01, fract } from "./utils/math"
import { rnd, rnd0 } from "./utils/rnd"

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

export function parametricSpace() {
  // todo: first compute the most important randomness-dependant settings

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

  return {
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
  }
}

export const Params = parametricSpace()
