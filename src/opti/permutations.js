const L = "xyzwstuv"

const db = (b) => {
  const O = []
  for (let i = 0; i < 2; i++) {
    O.unshift(L[b & 0x7])
    b >>= 3
  }
  return [b & 0x1, O]
}

const D = (bcode) => {
  let R = [],
    c = -1
  for (const b of bcode) {
    const [E, L] = db(b)
    if (!E && ++c % 2 === 0) R.push([[], []])
    R.at(-1)[c % 2].push(L)
  }
  return R
}

export function getPermutations() {
  return new Promise((R) => {
    const im = new Image()
    im.onload = () => {
      let W = im.width,
        ctx = new OffscreenCanvas(W, 1).getContext("2d")
      ctx.drawImage(im, 0, 0)
      let { data } = ctx.getImageData(0, 0, W, 1),
        out = new Uint8Array(W)
      for (let i = 0; i < W; i++) out[i] = data[i * 4]
      R(D(out))
    }
    im.src = "./permutations.png"
  })
}
