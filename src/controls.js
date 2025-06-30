import { Globals } from "./globals"
import { emitter } from "./utils/emitter"
import { lerp } from "./utils/math"
import { vec2 } from "./utils/vec"

const _v2a = vec2()
const _v2b = vec2()

class ControlsClass {
  constructor() {
    this.autoTracking = true
    this.txy = vec2(0, 0)
    this.txArray = Array(4)
    this.updateTxArray()
    this.emitter = emitter()
    this.largestOrganism = null

    this.trackingTarget = vec2()
    this.lastTrackingRefresh = -Infinity
  }

  init(world) {
    this.world = world
    this.#setScale(2.5)
    this.#setupTracking()

    window.addEventListener("resize", () => {
      this.#setBounds()
      this.#viewUpdated()
      this.#autoTrack()
    })
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
    this.trackingTarget.add(tx, ty)
    this.#viewUpdated()
  }

  tweakScale(ds) {
    this.scale += ds
    this.#setScale(this.scale + ds)
    this.#viewUpdated()
  }

  #setBounds() {
    const { x: w, y: h } = Globals.res
    const bd = vec2(1, 1).div(2).div(this.scale)

    this.trackBounds = {
      min: vec2(1, 1).sub(bd),
      max: bd,
    }

    // i'm not proud of this, but brain cells are gone
    if (h > w) {
      const dy = abs(w / h - 1.0) / 2
      this.trackBounds.min.y -= dy
      this.trackBounds.max.y += dy
    } else {
      const dx = abs(h / w - 1.0) / 2
      this.trackBounds.min.x -= dx
      this.trackBounds.max.x += dx
    }
  }

  #setScale(scale) {
    this.scale = scale
    this.#setBounds()
    this.#autoTrack()
  }

  #setTranslate(x, y) {
    this.txy.set(x, y)
    const d = abs(this.txArray[0] - x) + abs(this.txArray[1] - y)
    if (d > 0.001) this.updateTxArray()
  }

  updateTxArray() {
    const res = Globals.res
    this.txArray[0] = this.txy.x
    this.txArray[1] = this.txy.y
    this.txArray[2] = this.scale * (res.x > res.y ? res.y / res.x : 1)
    this.txArray[3] = this.scale * (res.x > res.y ? 1 : res.x / res.y)
  }

  #viewUpdated() {
    this.updateTxArray()
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
    this.#setTranslate(lerp(this.txy.x, tt.x, 0.1), lerp(this.txy.y, tt.y, 0.1))
  }
}

export const Controls = new ControlsClass()
