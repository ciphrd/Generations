export function mod(n, m) {
  return ((n % m) + m) % m
}

export function clamp(x, _min, _max) {
  return min(_max, max(_min, x))
}
