import { body } from "../physics/body"
import { Spring } from "../physics/constraints/spring"
import { mod } from "../utils/math"
import { vec2 } from "../utils/vec"
import { growDouble } from "./double"
import { growSegment } from "./segment"

export function growSection(ring, nSegments, start, end, width, properties) {
  const bodies = []
  const constraints = []

  const seg1Start = ring[start]
  const seg1End = ring[end]
  const seg2Start = ring[mod(start + 1, ring.length)]
  const seg2End = ring[mod(end - 1, ring.length)]

  const seg1 = growSegment(nSegments, seg1Start, seg1End, properties)
  const seg2 = growSegment(nSegments, seg2Start, seg2End, properties)

  const line1 = [seg1Start, ...seg1.bodies, seg1End]
  const line2 = [seg2Start, ...seg2.bodies, seg2End]

  const double = growDouble(line1, line2, width, false, properties)

  bodies.push(...seg1.bodies, ...seg2.bodies)
  constraints.push(
    ...seg1.constraints,
    ...seg2.constraints,
    ...double.constraints
  )

  return { bodies, constraints }
}
