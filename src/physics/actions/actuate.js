import { clamp, clamp01, lerp, sign } from "../../utils/math"
import { Action } from "./action"

// todo as general simulation parameter
const MAX_STRENGTH = 1.0

export class ActuateAction extends Action {
  constructor(body) {
    super(body)
    this.strength = this.prevStrength = 0
    this.initial = {
      friction: body.friction,
    }
    this.activation = -Infinity

    this.value = 0
    this.prevValue = 0
  }

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

  activate(t, dt, chemicalQuantity, values) {
    if (selection.selected === this.body) {
      // console.log("actuate", (values[0] - 0.5) * 2)
    }

    this.activation = t
    const v = clamp((values[0] - 0.5) * 2, -1, 1)

    for (const spring of this.body.springs) {
      spring.contraction = lerp(spring.contraction, v, 1)
    }

    this.prevValue = this.value
    this.value = v
  }

  apply(t, dt) {
    // todo
    // maybe use `this.activation`for lerping the value (though might be a bit)
    // weird when multiple actuate nodes control the body

    // motor seeds to test
    // - oosndjmYaEiCrkmEq92QnS6odMnBry9CKK4nL2MCm1gYMj9uJfX
    // - oo6vdhwCQyuE8h7xwn3hte5TAGZKSEupqaXUsyLLBWWYaFVEDJg
    // - oofAUnsDcAgncGqHzfh9kkjYpniVR1bAWysrrfYU4C5C3WfNSLU
    // - oohZWc1r9s8mFyrfduhZyUXMJDDRcom7dXh1vA3VRaNBwwebjiE

    let other, delta
    if (t - this.activation < 1_000) {
      for (const spring of this.body.springs) {
        other = spring.other(this.body)
        delta = this.value - this.prevValue
        // delta = spring.length - spring.prevLength

        if (abs(delta) < 0.00001) continue

        if (delta > 0) {
          this.body.friction = lerp(this.body.friction, 0.98, 0.4)
          other.friction = lerp(other.friction, other.initial.friction, 0.4)
        } else {
          this.body.friction = lerp(
            this.body.friction,
            this.body.initial.friction,
            0.4
          )
          other.friction = lerp(other.friction, 0.98, 0.4)
        }
      }
    }
  }
}
