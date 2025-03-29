import path from "node:path"
import sharp from "sharp"
import { encodedActivations } from "./activations.js"
import { encodedPermutations } from "./permutations.js"

const ROOT = path.join(import.meta.dirname, "..")
const OUTPUT_PATH = path.join(ROOT, "src", "seed.png")

/**
 * This script produces the seed.png image which contains the seeds of the
 * permutations and the bytecode activation sequences.
 *
 * The seed.png image is loaded at the start of the program and DNAs are
 * derived from these.
 *
 * The image is encoded with the following layout:
 *
 * +===========================================================================+
 * | PERMUTATIONS                                                              |
 * +===========================================================================+
 * | BYTECODE ACTIVATION SEQUENCES                                             |
 * +===========================================================================+
 * | ...                                                                       |
 * +=============================================+---+=========================+
 * | BYTECODE ACTIVATION SEQUENCES               | 0 |                         |
 * +=============================================+---+=========================+
 *
 * First row of the image: only permutations
 * Next rows: all the bytecode activation sequences, ended with a zero byte.
 */
async function main() {
  const permutations = encodedPermutations()
  const activations = encodedActivations()
  const width = permutations.length
  const height = 1 + Math.ceil(activations.length / width)
  const bytes = new Uint8Array(width * height).fill(0)

  for (let i = 0; i < permutations.length; i++) {
    bytes[i] = permutations[i]
  }

  for (let i = 0; i < activations.length; i++) {
    bytes[i + width] = activations[i]
  }

  await sharp(bytes, {
    raw: { width, height, channels: 1 },
  })
    .png()
    .toFile(OUTPUT_PATH)
}
main()
