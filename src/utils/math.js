export function mod(n, m) {
  if (m === 0) return n
  return ((n % m) + m) % m
}

export function clamp(x, _min, _max) {
  return min(_max, max(_min, x))
}

export function clamp01(x) {
  return clamp(x, 0, 0.9999)
}

export function lerp(start, end, t) {
  return (1 - t) * start + t * end
}

export function fract(n) {
  return n - floor(n)
}

export function angleForLerp(source, target) {
  if (abs(source - (target - TAU)) < abs(source - target)) return target - TAU
  return target
}

export function sign(x) {
  return x < 0 ? -1 : x > 0 ? 1 : 0
}

export function sigmoid(x) {
  return 1 / (1 + exp(-x))
}
