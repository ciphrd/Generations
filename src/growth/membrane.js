import { BodyFlags, body } from "../physics/body"
import { Alignement } from "../physics/constraints/alignment"
import { Friction } from "../physics/constraints/friction"
import { Spring } from "../physics/constraints/spring"
import { mod } from "../utils/math"
import { vec2 } from "../utils/vec"
import { growDouble } from "./double"

export function growMembrane(nSegments, center, radius, properties) {
  // derive the length of a segment based on the circle perimeter
  const segLen = (TAU * radius) / nSegments

  const { stiffness, damping } = properties
  const bodies = []
  const constraints = []

  let bod
  for (let i = 0; i < nSegments; i++) {
    const a = (i / nSegments) * TAU
    bod = body(vec2(cos(a), sin(a)).mul(radius).add(center))
    bod.addFlag(BodyFlags.GLOBAL_REPULSION)
    bodies.push(bod)
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
        damping
      )
    )
  }

  return { bodies, constraints }
}

export function growDoubleMembrane(
  nSegments,
  center,
  radius,
  width,
  properties
) {
  const bodies = []
  const constraints = []

  let { stiffness, damping } = properties
  const outer = growMembrane(nSegments, center, radius, properties)
  const inner = growMembrane(nSegments, center, radius - width, properties)

  stiffness = 0.5 * stiffness
  damping = 0.5 * damping

  constraints.push(
    ...growDouble(outer.bodies, inner.bodies, width, true, {
      stiffness,
      damping,
    }).constraints
  )

  bodies.push(...outer.bodies, ...inner.bodies)
  constraints.push(...outer.constraints, ...inner.constraints)

  return {
    bodies,
    constraints,
    parts: {
      outer,
      inner,
    },
  }
}
