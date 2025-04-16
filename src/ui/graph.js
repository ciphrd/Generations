import { arr } from "../utils/array"
import { mod } from "../utils/math"
import { vec2 } from "../utils/vec"

export class Graph {
  constructor($wrapper, ticker, sampler) {
    const bounds = $wrapper.getBoundingClientRect()
    this.$wrapper = $wrapper
    this.cvs = document.createElement("canvas")
    this.cvs.width = bounds.width * devicePixelRatio
    this.cvs.height = bounds.height * devicePixelRatio
    this.cvs.style.width = `${bounds.width}px`
    this.cvs.style.height = `${bounds.height}px`
    this.$wrapper.appendChild(this.cvs)

    this.ctx = this.cvs.getContext("2d")
    this.ctx.scale(this.cvs.width, this.cvs.height)
    this.ctx.translate(0.5, 0.5)
    this.ctx.scale(1, -1)
    this.ctx.translate(-0.5, -0.5)
    this.ctx.fillStyle = "#202727"
    this.ctx.fillRect(0, 0, this.cvs.width, this.cvs.height)
    this.texelSize = vec2(1 / this.cvs.width, 1 / this.cvs.height)

    this.sampler = sampler
    this.samples = sampler.def.map((_) => Array(this.cvs.width))
    this.idx = 0

    this.off = ticker.emitter.on("tick", () => {
      this.tick()
      this.draw()
    })

    this.noise = arr.new(sampler.def.length, () =>
      arr.new(this.cvs.width, () => (random() - 0.5) * 0.05)
    )

    this.graphHover = new GraphHover(this)
  }

  tick() {
    const samples = this.sampler.get()
    for (let i = 0; i < samples.length; i++) {
      this.samples[i][this.idx] = samples[i]
    }
    this.idx = (this.idx + 1) % this.cvs.width
  }

  val(s, i) {
    const def = this.sampler.def[s]
    return (
      (this.samples[s][i] + this.noise[s][i] - def.min) / (def.max - def.min)
    )
  }

  draw() {
    const I = mod(this.idx - 1, this.cvs.width)

    this.ctx.fillStyle = "rgba(255,255,255,0.15)"
    for (let i = 0; i < 20; i++) {
      this.ctx.fillRect(
        I / this.cvs.width,
        i / 20,
        this.texelSize.x,
        this.texelSize.y
      )
    }
    if (I % floor((this.cvs.height / 20) * 1.5) === 0) {
      this.ctx.fillRect(I / this.cvs.width, 0, this.texelSize.x, 1)
    }

    this.drawData()

    this.ctx.fillStyle = "#202727"
    this.ctx.fillRect(this.idx / this.cvs.width, 0, this.texelSize.x, 1)
    this.ctx.fillStyle = "#ff0000"
    this.ctx.fillRect((this.idx + 1) / this.cvs.width, 0, this.texelSize.x, 1)
  }

  drawData() {
    const def = this.sampler.def,
      N = def.length,
      I = mod(this.idx - 1, this.cvs.width)

    if (I === 0) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
      this.ctx.fillRect(0, 0, this.cvs.width, this.cvs.height)
    }

    for (let s = 0; s < N; s++) {
      this.ctx.lineWidth = this.texelSize.x * (def[s].lineWidth || 1)
      this.ctx.strokeStyle = def[s].color
      this.ctx.beginPath()

      this.ctx.moveTo(
        max(I - 1, 0) / this.cvs.width,
        this.val(s, max(0, I - 1))
      )

      this.ctx.lineTo(I / this.cvs.width, this.val(s, I))
      this.ctx.stroke()
    }
  }

  release() {
    this.off()
    this.cvs.remove()
  }
}

class GraphHover {
  constructor(graph) {
    this.$wrapper = graph.$wrapper
    this.graph = graph

    const bounds = this.$wrapper.getBoundingClientRect()
    this.cvs = document.createElement("canvas")
    this.cvs.classList.add("hover")
    this.cvs.width = bounds.width * devicePixelRatio
    this.cvs.height = bounds.height * devicePixelRatio
    this.cvs.style.width = `${bounds.width}px`
    this.cvs.style.height = `${bounds.height}px`
    this.$wrapper.appendChild(this.cvs)

    this.ctx = this.cvs.getContext("2d")
    this.ctx.scale(this.cvs.width, this.cvs.height)
    this.ctx.translate(0.5, 0.5)
    this.ctx.scale(1, -1)
    this.ctx.translate(-0.5, -0.5)
    this.ctx.fillStyle = "transparent"
    this.ctx.fillRect(0, 0, this.cvs.width, this.cvs.height)
    this.texelSize = vec2(1 / this.cvs.width, 1 / this.cvs.height)

    this.$values = document.createElement("div")
    this.$values.classList.add("graph-values")
    this.$wrapper.appendChild(this.$values)

    this.$wrapper.addEventListener("mousemove", this.onMouseMove)
    this.$wrapper.addEventListener("mouseleave", this.onMouseLeave)

    this.release = () => {
      this.$wrapper.removeEventListener("mousemove", this.onMouseMove)
      this.$wrapper.removeEventListener("mouseleave", this.onMouseLeave)
    }
  }

  onMouseMove = (evt) => {
    const bounds = this.$wrapper.getBoundingClientRect()
    const samples = this.graph.samples.map((samples) => samples[evt.offsetX])

    const x = evt.offsetX / bounds.width
    const y = evt.offsetY / bounds.height
    const I = floor(evt.offsetX * devicePixelRatio)

    this.$values.style.left = `${evt.offsetX + 3}px`
    this.$values.innerHTML = ""
    this.$values.classList.add("show")

    this.ctx.clearRect(0, 0, 1, 1)
    this.ctx.save()

    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"
    this.ctx.lineWidth = this.texelSize.x
    this.ctx.setLineDash([this.texelSize.y * 5, this.texelSize.y * 5])

    this.ctx.beginPath()
    this.ctx.moveTo(x, 0)
    this.ctx.lineTo(x, 1)
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.lineWidth = this.texelSize.y
    this.ctx.setLineDash([this.texelSize.x * 5, this.texelSize.x * 5])
    this.ctx.moveTo(0, 1 - evt.offsetY / bounds.height)
    this.ctx.lineTo(1, 1 - evt.offsetY / bounds.height)
    this.ctx.stroke()

    this.ctx.restore()

    for (let i = 0; i < this.graph.samples.length; i++) {
      const val = this.graph.samples[i][I]
      if (typeof val === "undefined") {
        this.onMouseLeave()
        return
      }
      const $val = document.createElement("div")
      $val.classList.add("value")
      $val.innerHTML = `<div class="color" style="background:${
        this.graph.sampler.def[i].color
      };"></div><span>${
        this.graph.sampler.def[i].name
      }</span><span>${val.toFixed(2)}</span>`
      this.$values.append($val)
    }
  }

  onMouseLeave = (evt) => {
    this.ctx.clearRect(0, 0, 1, 1)
    this.$values.classList.remove("show")
  }
}
