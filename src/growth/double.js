import { Spring } from "../physics/constraints/spring"
import { mod } from "../utils/math"

export function growDouble(line1, line2, width, loop, properties) {
  const constraints = []
  const { stiffness, damping } = properties

  for (let i = 0; i < line1.length; i++) {
    constraints.push(new Spring(line1[i], line2[i], width, stiffness, damping))
    if (i < line1.length - 1 || loop) {
      constraints.push(
        new Spring(
          line1[i],
          line2[mod(i + 1, line2.length)],
          width,
          stiffness,
          damping
        )
      )
    }
  }

  return { constraints }
}
