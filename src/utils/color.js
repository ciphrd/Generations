import { str } from "./string"

export class Color {
  constructor(r, g, b, a = 1) {
    this.r = r
    this.g = g
    this.b = b
    this.a = a
    this.rgb = [r, g, b]
    this.rgba = [r, g, b, a]
  }

  static fromByteRgb332(byte) {
    return new Color((byte >> 5) / 7, ((byte >> 2) & 7) / 7, (byte & 3) / 3)
  }

  int() {
    return (this.r << 16) + (this.g << 8) + this.b
  }

  hex() {
    return "#" + str.hexbytes(this.rgb).join("")
  }

  css() {
    return `rgba(${this.r * 255}, ${this.g * 255}, ${this.b * 255}, ${this.a})`
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
