import { Spring } from "../../physics/constraints/spring"

export function triangulate(p1, p2, p3, p4, length, properties) {
  const { stiffness, damping } = properties
  return [
    new Spring(p1, p3, length, stiffness, damping),
    new Spring(p2, p4, length, stiffness, damping),
    new Spring(p2, p3, length, stiffness, damping),
  ]
}
