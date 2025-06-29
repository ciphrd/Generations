import { Operation } from "../../bytecode/cpu"
import { arr } from "../../utils/array"
import { clamp, clamp01 } from "../../utils/math"
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
    merge: (operations) => [operations.at(-1)],
    normalize: (v) => clamp(v, -1, 1),
  },
  fire: {
    module: FireAction,
    merge: (operations) => {
      let highest = 0
      for (const op of operations) {
        if (abs(op.energy) > abs(highest)) highest = op.energy
      }
      return [new Operation("fire", highest)]
    },
    normalize: (v) => v,
  },
  grab: {
    module: GrabAction,
    merge: (operations) => [operations.at(-1)],
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
