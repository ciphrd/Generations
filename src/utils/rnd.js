import { lerp } from "./math"

export const rnd = {
  range(min, max) {
    return lerp(min, max, $fx.rand())
  },
  int(min, max) {
    return floor(this.range(min, max))
  },
}
