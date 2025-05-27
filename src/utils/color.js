import { str } from "./string"

export class Color {
  constructor(r, g, b, a = 1) {
    this.r = r
    this.g = g
    this.b = b
    this.a = a
  }

  static fromByteRgb332(byte) {
    return new Color(
      round(((byte >> 5) / 7) * 255),
      round((((byte >> 2) & 7) / 7) * 255),
      round(((byte & 3) / 3) * 255)
    )
  }

  int() {
    return (this.r << 16) + (this.g << 8) + this.b
  }

  hex() {
    return "#" + str.hexbytes(this.rgbarr()).join("")
  }

  css() {
    if (this.a === 1) return this.hex()
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`
  }

  rgbarr() {
    return [this.r, this.g, this.b]
  }

  clone() {
    return new Color(this.r, this.g, this.b, this.a)
  }

  copy(color) {
    this.r = color.r
    this.g = color.g
    this.b = color.b
    this.a = color.a
  }

  toString() {
    return `[${this.r}, ${this.g}, ${this.b}, ${this.a}]`
  }
}
