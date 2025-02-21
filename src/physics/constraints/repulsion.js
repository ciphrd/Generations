import { BodyFlags } from "../body"

/**
 * Global repulsion.
 * Uses space hash partionning to reduce amount of computations.
 */
export class GlobalRepulsion {
  constructor(bodies) {
    this.bodies = bodies
  }

  apply(dt) {
    // filter bodies which are subject to global repulsion
    const filtered = this.bodies.filter((body) =>
      body.hasFlag(BodyFlags.GLOBAL_REPULSION)
    )
  }
}
