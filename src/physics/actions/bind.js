import { clamp, clamp01, lerp, sign } from "../../utils/math"
import { BodyFlags } from "../body"
import { Spring, SpringFlags } from "../constraints/spring"
import { Action } from "./action"

const BIND_DIST = 0.11

export class BindAction extends Action {
  constructor(body) {
    super(body)
    this.strength = 0
    this.spring = null

    body.world.emitter.on("bodies:updated", () => {
      if (!this.spring) return
      if (
        !body.world.includesBody(this.spring.bodyA) ||
        !body.world.includesBody(this.spring.bodyB)
      ) {
        this.deleteSpring()
      }
    })
  }

  activate(t, dt, energy) {
    this.strength = energy
    if (this.spring || this.strength <= 0) return

    const part = this.body.world.partition(BIND_DIST, BodyFlags.BINDABLE)
    let closest,
      closestD = Infinity,
      d
    for (const b of part.neighbours(this.body)) {
      if (b.data.organism === this.body.data.organism) continue
      // todo: move this (and other dist calc between bodies) to compute cache
      d = this.body.pos.dist(b.pos)
      if (d - b.radius < BIND_DIST && d < closestD) {
        closestD = d
        closest = b
      }
    }

    if (closest) {
      this.spring = new Spring(
        this.body,
        closest,
        0.02,
        100,
        5,
        "255,0,255",
        SpringFlags.BIND
      )
      this.body.world.addConstraint("pre", this.spring)
    }
  }

  apply(t, dt) {
    if (!this.spring) return
    this.strength -= 0.01
    if (this.strength <= 0) {
      this.deleteSpring()
    }
  }

  deleteSpring() {
    this.spring.delete()
    this.body.world.removeConstraint("pre", this.spring)
    this.spring = null
  }
}
