import { body } from "../physics/body"
import { Alignement } from "../physics/constraints/alignment"
import { Friction } from "../physics/constraints/friction"
import { Spring } from "../physics/constraints/spring"
import { mod } from "../utils/math"
import { vec2 } from "../utils/vec"

export function growMembrane(nSegments, center, radius, properties) {
  // derive the length of a segment based on the circle perimeter
  const segLen = (TAU * radius) / nSegments

  const { stiffness, dampening } = properties
  const bodies = []
  const constraints = []

  for (let i = 0; i < nSegments; i++) {
    const a = (i / nSegments) * TAU
    bodies.push(body(vec2(cos(a), sin(a)).mul(radius).add(center)))
  }

  for (let i = 0; i < nSegments; i++) {
    constraints.push(
      new Alignement(
        bodies[i],
        [...Array(3)].flatMap((_, di) => [
          bodies[mod(i - di, nSegments)],
          bodies[mod(i + di, nSegments)],
        ])
      ),
      new Friction(bodies[i], 0.01),
      new Spring(
        bodies[i],
        bodies[(i + 1) % nSegments],
        segLen,
        stiffness,
        dampening
      )
    )
  }

  return { bodies, constraints }
}
