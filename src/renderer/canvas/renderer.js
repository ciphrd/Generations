import { Controls } from "../../controls"
import { Globals } from "../../globals"
import { Body } from "../../physics/body"
import { Spring } from "../../physics/constraints/spring"
import { Food } from "../../physics/entities/food"
import { Renderer } from "../renderer"
import { renderActuator } from "./actuator"
import { renderAnchor } from "./anchor"
import { renderBody } from "./body"
import { renderEater } from "./eater"
import { renderFoodSeeker } from "./food-seeker"
import { renderNodeSelection } from "./interactions"
import { renderSensors } from "./sensors"
import { renderSpring } from "./spring"

const W = window.innerWidth
const H = window.innerWidth

const renderers = {
  [Body.name]: renderBody,
  [Food.name]: renderBody,
  [Spring.name]: renderSpring,
  Eater: renderEater,
  Actuator: renderActuator,
  Anchor: renderAnchor,
  FoodSeeker: renderFoodSeeker,
  NodeSelection: renderNodeSelection,
}

export function arc(index) {
  return [(index * 2 * PI) / 6, ((index + 1) * 2 * PI) / 6]
}

export class CanvasRenderer extends Renderer {
  constructor(world, selection) {
    super(world, selection)

    this.entities = [world.bodies, world.constraints.pre, [selection]]
    this.cvs = document.createElement("canvas")
    this.cvs.id = "sim"
    this.cvs.width = W * devicePixelRatio
    this.cvs.height = H * devicePixelRatio
    this.cvs.style.width = W + "px"
    this.cvs.style.height = H + "px"
    this.ctx = this.cvs.getContext("2d")
    this.ctx.scale(this.cvs.width, this.cvs.height)
    this.ctx.translate(0.5, 0.5)
    this.ctx.scale(1, -1)
    this.ctx.translate(-0.5, -0.5)
    this.texelSize = 1 / this.cvs.width

    Globals.res.x = Globals.deviceRes.x = W
    Globals.res.y = Globals.deviceRes.y = H
  }

  providerRenderingContainer($container) {
    super.providerRenderingContainer($container)
    this.$container.appendChild(this.cvs)
  }

  render() {
    this.ctx.fillStyle = "black"
    this.ctx.fillRect(0, 0, 1, 1)

    const txMatrix = Controls.getTxMatrix()
    this.ctx.save()
    this.ctx.translate(txMatrix[0] / txMatrix[2], txMatrix[1] / txMatrix[3])
    this.ctx.translate(0.5, 0.5)
    this.ctx.scale(txMatrix[2], txMatrix[3])
    this.ctx.translate(-0.5, -0.5)

    let renderer
    for (const group of this.entities) {
      for (const ent of group) {
        renderer = renderers[ent.constructor.name]
        if (!renderer) continue
        renderer(this.ctx, ent)
        if (ent.sensors) renderSensors(this.ctx, ent.sensors)
      }
    }

    this.ctx.restore()
  }
}
