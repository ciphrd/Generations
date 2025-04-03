import { Action } from "./action"

// todo as general simulation parameter
const MAX_STRENGTH = 1.0

export class ActuateAction extends Action {
  constructor(body) {
    super(body)
    this.strength = 0
  }

  // todo
  // change here
  // probably want something where we just set contract to "on" / "off",
  // and if "on" it contracts the muscle ; can lead to more generic behaviours

  // todo
  // actually need to rethink this to get more specific behaviours to emerge
  // right now either it's too complexe to get unique behaviour or we hardcode
  // a specific behaviour which will be bad
  // instead, we probably want the actuate action to be able to control the
  // "length" of the muscle, and to do that we can't just output a 0 or 1 to
  // trigger the action.
  // instead we need some more granular control.
  // maybe signals are automatically pushed into the CPU stack to facilitate
  // passing the value
  // maybe there's a single CPU call with all the signals fed into the stack
  // maybe we can't get a chemical value using the bytecode, instead the bytecode
  // provides more functions to manipulate the values
  // sadly it's gonna be hard to apply math function on 4 bit values, so we may
  // get limited behaviours on that front, we may want to think about what's
  // possible on that level
  // if there are chemical values in the stack,
  // ACTUALLY activation bytecode doesn't work on 4bit values in the stack,
  // so instead if could be designed to work specifically with float values ?
  // then using specific math functions we can actually encode pretty unique
  // behaviours if using the values in the stack to drive the actions

  activate(dt, chemicalQuantity, values) {
    if (this.body.id === 0) {
      // console.log("actuate", values[0])
    }
    for (const spring of this.body.springs) {
      spring.contract(/*values[0] **/ dt)
    }
  }

  apply(t, dt) {}
}
