import { Operation } from "../../bytecode/cpu"
import { ActuateAction } from "./actuate"
import { BackwardAction } from "./backward"
import { FireAction } from "./fire"
import { ForwardAction } from "./forward"

export const Actions = {
  forward: {
    module: ForwardAction,
    merge: (operations) => operations.at(-1),
  },
  backward: {
    module: BackwardAction,
    merge: (operations) => operations.at(-1),
  },
  actuate: {
    module: ActuateAction,
    merge: (operations) => operations.at(-1),
  },
  fire: {
    module: FireAction,
    merge: (operations) => operations.at(-1),
  },
}
