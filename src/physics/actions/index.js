import { Operation } from "../../bytecode/cpu"
import { arr } from "../../utils/array"
import { clamp01 } from "../../utils/math"
import { ActuateAction } from "./actuate"
import { BackwardAction } from "./backward"
import { BindAction } from "./bind"
import { EatAction } from "./eat"
import { FireAction } from "./fire"
import { ForwardAction } from "./forward"
import { GrabAction } from "./grab"

/**
 * Potential solution to the signal processing issue
 *
 * At it's core, the problem is that it's hard to combine multiple signals
 * in a consistent way (the max() fn seems to be best, but has issues).
 *
 * It's hard to merge multiple fire signals knowing they will have an impact
 * on the whole behaviour of the system.
 *
 * Also, the chemical strength value is directly the same as the signal value,
 * which prevents actual values from being passed through the network.
 *
 * Ideas
 * - Dissociate chemical signals with the number they carry.
 *
 */

export const Actions = {
  forward: {
    module: ForwardAction,
    merge: (operations) => [operations.at(-1)],
    normalize: (v) => clamp01(v),
  },
  backward: {
    module: BackwardAction,
    merge: (operations) => [operations.at(-1)],
    normalize: (v) => clamp01(v),
  },
  actuate: {
    module: ActuateAction,
    merge: (operations) => [
      new Operation(
        "actuate",
        arr.max(operations, (op) => op.chemicalStrength),
        [arr.sum(operations, (op) => op.values[0]) / operations.length]
      ),
    ],
    normalize: (v) => clamp01(v),
  },
  fire: {
    module: FireAction,
    mergeCpu: (operations) => {
      //! only last
      // return [operations.at(-1)]

      //! highest of each chemical
      const chems = arr.new(4, 0)
      for (const op of operations) {
        chems[op.values[0]] = max(chems[op.values[0]], op.chemicalStrength)
      }
      const fire = []
      for (let i = 0; i < 4; i++) {
        if (chems[i] > 0) {
          fire.push(new Operation("fire", chems[i], [i]))
        }
      }
      return fire
    },
    merge: (operations) => {
      //! always highest chemical
      let op = operations[0]
      for (let i = 1; i < operations.length; i++) {
        if (operations[i].chemicalStrength > op.chemicalStrength) {
          op = operations[i]
        }
      }
      return [op]

      //! only last
      // return [operations.at(-1)]

      //! average of each chemical
      // const chems = arr.new(4, () => [])
      // for (const op of operations) {
      //   chems[op.values[0]].push(op.chemicalStrength)
      // }
      // const fire = []
      // let c
      // for (let i = 0; i < 4; i++) {
      //   c = chems[i].length > 0 ? arr.avg(chems[i]) : 0
      //   if (c > 0) {
      //     fire.push(new Operation("fire", c, [i]))
      //   }
      // }
      // return fire

      //! highest of each chemical
      // const chems = arr.new(4, 0)
      // for (const op of operations) {
      //   chems[op.values[0]] = max(chems[op.values[0]], op.chemicalStrength)
      // }
      // const fire = []
      // for (let i = 0; i < 4; i++) {
      //   if (chems[i] > 0) {
      //     fire.push(new Operation("fire", chems[i], [i]))
      //   }
      // }
      // return fire

      //! multiply each chemical
      // const chems = arr.new(4, null)
      // for (const op of operations) {
      //   if (chems[op.values[0]] === null) chems[op.values[0]] = 1
      //   chems[op.values[0]] *= op.chemicalStrength
      // }
      // const fire = []
      // for (let i = 0; i < 4; i++) {
      //   if (chems[i] !== null && chems[i] > 0) {
      //     fire.push(new Operation("fire", chems[i], [i]))
      //   }
      // }
      // return fire
    },
    normalize: (v) => v,
  },
  grab: {
    module: GrabAction,
    merge: (operations) => [
      new Operation(
        "grab",
        arr.max(operations, (op) => op.chemicalStrength),
        [arr.sum(operations, (op) => op.values[0]) / operations.length]
      ),
    ],
    normalize: (v) => clamp01(v),
  },
  eat: {
    module: EatAction,
    merge: (operations) => [operations.at(-1)],
    normalize: (v) => v,
  },
  bind: {
    module: BindAction,
    merge: (operations) => [operations.at(-1)],
    normalize: (v) => v,
  },
}
