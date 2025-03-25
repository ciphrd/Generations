function isVec(v) {
  return typeof v === "object" && "x" in v
}

export class Vec2 {
  constructor(a1 = 0, a2 = 0) {
    if (isVec(a1)) {
      this.x = a1.x
      this.y = a1.y
    } else {
      ;(this.x = a1), (this.y = a2)
    }
  }
  set(x, y) {
    this.x = x
    this.y = y
    return this
  }
  res() {
    return this.set(0, 0)
  }
  copy(v2) {
    this.x = v2.x
    this.y = v2.y
    return this
  }
  clone() {
    return vec2(this)
  }
  apply(fn) {
    this.x = fn(this.x)
    this.y = fn(this.y)
    return this
  }
  apply2(fn) {
    ;[this.x, this.y] = fn(this.x, this.y)
    return this
  }
  add(a1, a2) {
    if (isVec(a1)) {
      this.x += a1.x
      this.y += a1.y
    } else {
      this.x += a1
      this.y += a2
    }
    return this
  }
  sub(a1, a2) {
    if (isVec(a1)) {
      this.x -= a1.x
      this.y -= a1.y
    } else {
      this.x -= a1
      this.y -= a2
    }
    return this
  }
  mul(x) {
    this.x *= x
    this.y *= x
    return this
  }
  dot(v) {
    return this.x * v.x + this.y * v.y
  }
  div(x) {
    return this.mul(1 / x)
  }
  lenSq() {
    return this.x ** 2 + this.y ** 2
  }
  len() {
    return sqrt(this.lenSq())
  }
  normalize() {
    return this.mul(1 / this.len())
  }
  distSq(a1, a2) {
    if (isVec(a1)) {
      a2 = a1.y
      a1 = a1.x
    }
    return (this.x - a1) ** 2 + (this.y - a2) ** 2
  }
  dist(a1, a2) {
    return sqrt(this.distSq(a1, a2))
  }
  toString() {
    return `(${this.x}; ${this.y})`
  }
  outside() {
    return this.x < 0 || this.x >= 1 || this.y < 0 || this.y >= 1
  }
  angle() {
    return atan2(this.y, this.x)
  }
  fromAngle(angle) {
    this.x = cos(angle)
    this.y = sin(angle)
    return this
  }
}

export function vec2(a1, a2) {
  return new Vec2(a1, a2)
}
