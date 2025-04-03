import { arr } from "../utils/array"

const L = "xyzwstuv"

const db = (b) => {
  const O = []
  for (let i = 0; i < 2; i++) {
    O.unshift(L[b & 0x7])
    b >>= 4 - i
  }
  return [b & 0x1, O]
}

const D = (bcode) => {
  let R = [],
    c = -1
  for (const b of bcode) {
    const [E, L] = db(b)
    if (E && ++c % 2 === 0) R.push([[], []])
    R.at(-1)[c % 2].push(L)
  }
  return R
}

function decodePermutations(bytes) {
  const O = []
  let c = -1
  for (const byte of bytes) {
    if (byte & 128 && ++c % 2 === 0) O.push([])
    O.at(-1).push(byte)
  }
  return O
}

function decodeActivations(bytes) {
  const sequences = []
  let sequence,
    left = 0

  for (const b of bytes) {
    if (left === 0) {
      if (sequence) sequences.push(sequence)
      if (b === 0) return sequences
      sequence = new Uint8Array(b)
      left = b
    } else {
      sequence[sequence.length - left] = b
      left--
    }
  }
}

export function getSeeds() {
  return new Promise((R) => {
    const im = new Image()
    im.onload = () => {
      let W = im.width,
        H = im.height,
        ctx = new OffscreenCanvas(W, H).getContext("2d")
      ctx.drawImage(im, 0, 0)
      let { data } = ctx.getImageData(0, 0, W, H),
        perm = new Uint8Array(W),
        acti = new Uint8Array(W * (H - 1))
      for (let i = 0; i < W; i++) {
        perm[i] = data[i * 4]
        for (let j = 0; j < H - 1; j++) {
          acti[i + j * W] = data[(W + i + j * W) * 4]
        }
      }
      R({
        activations: arr.shuffle(decodeActivations(acti)),
        permutations: arr.shuffle(decodePermutations(perm)),
      })
    }
    im.src = "./seed.png"
  })
}
