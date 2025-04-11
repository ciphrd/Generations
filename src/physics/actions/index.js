import { Operation } from "../../bytecode/cpu"
import { arr } from "../../utils/array"
import { clamp01 } from "../../utils/math"
import { ActuateAction } from "./actuate"
import { BackwardAction } from "./backward"
import { EatAction } from "./eat"
import { FireAction } from "./fire"
import { ForwardAction } from "./forward"
import { GrabAction } from "./grab"

export const Actions = {
  forward: {
    module: ForwardAction,
    merge: (operations) => operations.at(-1),
    normalize: (v) => clamp01(v),
  },
  backward: {
    module: BackwardAction,
    merge: (operations) => operations.at(-1),
    normalize: (v) => clamp01(v),
  },
  actuate: {
    module: ActuateAction,
    merge: (operations) =>
      new Operation(
        "actuate",
        arr.sum(operations, (op) => op.values[0]) / operations.length
      ),
    normalize: (v) => clamp01(v),
  },
  fire: {
    module: FireAction,
    merge: (operations) => operations.at(-1),
    normalize: (v) => clamp01(v),
  },
  grab: {
    module: GrabAction,
    merge: (operations) =>
      new Operation(
        "grab",
        arr.sum(operations, (op) => op.values[0]) / operations.length
      ),
    normalize: (v) => clamp01(v),
  },
  eat: {
    module: EatAction,
    merge: (operations) => operations.at(-1),
    normalize: (v) => v,
  },
}
