import { mod } from "../utils/math"

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
    this.ctx.fillStyle = "black"
    this.ctx.fillRect(0, 0, this.cvs.width, this.cvs.height)
    this.texelSize = 1 / this.cvs.width

    this.sampler = sampler
    this.samples = sampler.def.map((_) => Array(this.cvs.width))
    this.idx = 0

    this.off = ticker.emitter.on("tick", () => {
      this.tick()
      this.draw()
    })
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
    return (this.samples[s][i] - def.min) / (def.max - def.min)
  }

  draw() {
    this.drawData()

    this.ctx.fillStyle = "black"
    this.ctx.fillRect(this.idx / this.cvs.width, 0, this.texelSize, 1)
    this.ctx.fillStyle = "#ff0000"
    this.ctx.fillRect((this.idx + 1) / this.cvs.width, 0, this.texelSize, 1)
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
      this.ctx.lineWidth = this.texelSize * (def[s].lineWidth || 1)
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
