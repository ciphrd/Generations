import { Eater } from "../interactions/eat"
import { body } from "../physics/body"
import { Friction } from "../physics/constraints/friction"
import { LAR, larf } from "../physics/constraints/lar"
import { Spring } from "../physics/constraints/spring"

export function growArm(root, nSegments, foodBodies) {
  const constraints = []
  const bodies = []

  for (let i = 0; i < nSegments; i++) {
    bodies.push(body(root.pos.clone()))
    constraints.push(
      new Spring(i === 0 ? root : bodies[i - 1], bodies[i], 0.01, 80, 10),
      new Friction(bodies[i], 0.02)
    )
  }

  constraints.push(
    new LAR(bodies.at(-1), foodBodies, {
      attr: larf(0.35, 0.03),
      rep: larf(0, 0),
    }),
    new Eater(bodies.at(-1), foodBodies, 0.02)
  )

  return { bodies, constraints }
}
