import { body } from "../physics/body"
import { Spring } from "../physics/constraints/spring"
import { vec2 } from "../utils/vec"

export function growSegment(nDivisions, start, end, properties) {
  const bodies = []
  const constraints = []

  const { stiffness, damping, contracted } = properties

  const vSE = vec2(end.pos).sub(start.pos)
  const segLen = (contracted * vSE.len()) / nDivisions

  let t
  for (let i = 0; i < nDivisions - 1; i++) {
    t = (i + 1) / nDivisions
    const pos = vec2(start.pos).add(vSE.clone().mul(t))
    bodies.push(body(pos))
    constraints.push(
      new Spring(
        i === 0 ? start : bodies[i - 1],
        bodies[i],
        segLen,
        stiffness,
        damping
      )
    )
  }

  constraints.push(new Spring(bodies.at(-1), end, segLen, stiffness, damping))

  return { bodies, constraints }
}
