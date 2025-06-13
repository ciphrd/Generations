import { res } from "./renderer/webgl/renderer"
import { emitter } from "./utils/emitter"
import { lerp } from "./utils/math"
import { vec2 } from "./utils/vec"

const _v2a = vec2()
const _v2b = vec2()

class ControlsClass {
  constructor() {
    this.autoTracking = true
    this.txy = vec2(0, 0)
    this.#setScale(2.5)
    this.txArray = Array(4)
    this.#setTransformArray()
    this.emitter = emitter()
    this.largestOrganism = null

    this.trackingTarget = vec2()
    this.lastTrackingRefresh = -Infinity
  }

  init(world) {
    this.world = world
    this.#setupTracking()
  }

  setTracking(enabled) {
    this.autoTracking = enabled
    this.emitUpdated()
    this.#setupTracking()
  }

  #setupTracking() {
    if (!this.autoTracking) return
    // find the biggest organism
    const organisms = {}
    for (const body of this.world.bodies) {
      if (body.data.organism < 0) continue
      if (!organisms[body.data.organism]) organisms[body.data.organism] = []
      organisms[body.data.organism].push(body)
    }
    this.largestOrganism = Object.entries(organisms)
      .sort((a, b) => b[1].length - a[1].length)
      .at(0)
      .at(1)
  }

  emitUpdated() {
    this.emitter.emit("updated")
  }

  translate(tx, ty) {
    // todo: compute here the actual tx value needed for best ux
    this.trackingTarget.add(tx, ty)
    this.#viewUpdated()
  }

  tweakScale(ds) {
    // todo compute scale value needed for best ux
    this.scale += ds
    this.#setScale(this.scale + ds)
    this.#viewUpdated()
  }

  #setScale(scale) {
    this.scale = scale
    const halfScaled = vec2(0.5, 0.5).div(scale)
    this.trackBounds = {
      min: vec2(1, 1).sub(halfScaled),
      max: halfScaled,
    }
    this.#autoTrack()
  }

  #setTransformArray() {
    this.txArray[0] = this.txy.x
    this.txArray[1] = this.txy.y
    this.txArray[2] = this.scale * (res.x > res.y ? res.y / res.x : 1)
    this.txArray[3] = this.scale * (res.x > res.y ? 1 : res.x / res.y)
  }

  #viewUpdated() {
    this.emitUpdated()
  }

  #autoTrack() {
    if (!this.largestOrganism) return
    const tt = this.trackingTarget
    // compute center of larget organism
    let _min = _v2a,
      _max = _v2b
    _min.set(Infinity, Infinity)
    _max.set(-Infinity, -Infinity)
    for (const body of this.largestOrganism) {
      _min.set(min(_min.x, body.pos.x), min(_min.y, body.pos.y))
      _max.set(max(_max.x, body.pos.x), max(_max.y, body.pos.y))
    }
    tt.copy(_min).add(_max).div(2)
    tt.clamp(this.trackBounds.min, this.trackBounds.max)
    tt.sub(0.5, 0.5)
      .mul(this.scale * 2.0)
      .apply((x) => -x)
  }

  get() {
    return {
      autoTracking: this.autoTracking,
      transation: this.txy,
      scale: this.scale,
      instance: this,
    }
  }

  getTxMatrix() {
    return this.txArray
  }

  update(t, dt) {
    const tt = this.trackingTarget

    if (this.autoTracking && t - this.lastTrackingRefresh > 1000) {
      this.lastTrackingRefresh = t
      this.#autoTrack()
    }

    // slowly move camera to target
    this.txy.set(lerp(this.txy.x, tt.x, 0.1), lerp(this.txy.y, tt.y, 0.1))
  }
}

export const Controls = new ControlsClass()
