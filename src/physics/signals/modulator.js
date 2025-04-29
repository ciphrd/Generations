import { clamp, lerp, sigmoid } from "../../utils/math.js"

function smooth(x) {
  return tanh(x * 10)
}

export class DirectionalModulator {
  constructor(bodyA, bodyB, alpha = 0.8, decay = 0.01) {
    this.bodyA = bodyA
    this.bodyB = bodyB
    // >0 favors A→B, <0 favors B→A
    this.modulation = 0
    this.alpha = alpha
    this.decay = decay
  }

  modulate(Iab, Iba, out) {
    const delta = this.alpha * (abs(Iab) - abs(Iba))
    this.modulation += delta
    this.modulation -= this.decay * this.modulation

    const factor = smooth(this.modulation)
    out[0] = (Iab * (factor + 1)) / 2
    out[1] = Iba * ((1 - factor) / 2)

    out[0] = lerp(Iab, out[0], 1)
    out[1] = lerp(Iba, out[1], 1)

    // if (selection.is(this.bodyA) || selection.is(this.bodyB)) {
    //   console.log("modulate", {
    //     bodyA: this.bodyA.id,
    //     bodyB: this.bodyB.id,
    //     Iab,
    //     Iba,
    //     out: [...out],
    //     modulation: this.modulation,
    //     factor,
    //   })
    // }
  }
}

export const modulator = (a, b) => new DirectionalModulator(a, b)
