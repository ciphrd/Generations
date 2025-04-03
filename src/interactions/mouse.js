import { vec2 } from "../utils/vec"

class MouseSingleton {
  #$wrapper
  #wrapperBounds

  constructor() {
    this.pos = vec2()
    this.down = false
    this.listeners = {
      move: [],
      down: [],
    }
  }
  init($el) {
    this.#$wrapper = $el
    this.#computeBounds()
    new ResizeObserver(this.#computeBounds).observe(this.#$wrapper)

    $el.addEventListener("mouseenter", (evt) => {
      this.#computeRelativePos(evt.clientX, evt.clientY)
    })
    $el.addEventListener("mousemove", (evt) => {
      this.#computeRelativePos(evt.clientX, evt.clientY)
      this.listeners.move.forEach((cb) => cb())
    })
    $el.addEventListener("mousedown", (evt) => {
      if (!this.down) {
        this.down = true
        this.listeners.down.forEach((cb) => cb())
      }
    })
    $el.addEventListener("mouseup", (evt) => (this.down = false))
    $el.addEventListener("mouseleave", (evt) => (this.down = false))
  }
  #computeBounds = () => {
    this.#wrapperBounds = this.#$wrapper.getBoundingClientRect()
  }
  #computeRelativePos = (absX, absY) => {
    this.pos.set(
      (absX - this.#wrapperBounds.x) / this.#wrapperBounds.width,
      1 - (absY - this.#wrapperBounds.y) / this.#wrapperBounds.height
    )
  }
  on(evt, cb) {
    const listeners = this.listeners[evt]
    listeners.push(cb)
    return () => {
      listeners.splice(listeners.indexOf(cb), 1)
    }
  }
}
export const Mouse = new MouseSingleton()

export class MouseFollow {
  #v2
  constructor(body, strength = 10) {
    this.body = body
    this.strength = strength
    this.#v2 = vec2()
  }
  apply(dt) {
    if (!Mouse.down) return
    this.#v2.copy(Mouse.pos).sub(this.body.pos)
    this.body.acc.add(this.#v2.mul(this.strength))
  }
}
