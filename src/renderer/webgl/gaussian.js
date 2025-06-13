import { arr } from "../../utils/array"
import { glu } from "../../utils/glu"
import fullVS from "./shaders/full.vert.glsl"
import gaussianFS from "./shaders/gaussian.frag.glsl"

function gaussianKernel(width) {
  const sigma = 0.3 * (floor(width / 2) - 1) + 0.8
  const sigma2 = 2 * sigma ** 2
  const kernel = arr.new(ceil(width / 2))
  let sum = 0
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] = exp(-(i * i) / sigma2)
    sum += kernel[i] * min(2, 1 + i)
  }
  return kernel.map((v) => v / sum)
}

let initialized = {}
function initProgram(gl, width) {
  // make sure width is odd and integer
  width = floor(width) - (1 - (width % 2))

  const key = width
  if (initialized[key]) return initialized[key]

  const program = glu.program(gl, fullVS, gaussianFS, {
    attributes: ["a_position"],
    uniforms: ["u_texture", "u_dir"],
    variables: {
      WIDTH: width.toFixed(0),
      KERNEL: gaussianKernel(width)
        .map((v) => v.toFixed(5))
        .join(","),
    },
    vao: (prog) => (u) => {
      u.attrib(prog.attributes.a_position, glu.quad(gl), 2)
    },
  })

  initialized[key] = program
  return initialized[key]
}
export const initGaussianProgram = initProgram

export class GaussianPass {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(
    gl,
    getInputs,
    width,
    { format = gl.RGBA32F, wrap = gl.CLAMP_TO_EDGE } = {}
  ) {
    this.gl = gl
    this.getInputs = getInputs
    this.program = initProgram(gl, width)
    this.options = { format, wrap }
    this.#allocate()
  }

  #allocate() {
    const { gl, options, getInputs } = this

    // free resources if any
    glu.free(gl, this.rt1, this.rt2)

    const inputs = getInputs()
    this.res = inputs.res
    this.texture = inputs.tex
    this.rt1 = glu.renderTarget(
      gl,
      this.res.x,
      this.res.y,
      options.format,
      options
    )
    this.rt2 = glu.renderTarget(
      gl,
      this.res.x,
      this.res.y,
      options.format,
      options
    )
    this.texel = this.res.clone().inv()
    this.output = this.rt2.texture
  }

  onResize() {
    this.#allocate()
  }

  render(tex = null) {
    if (tex) this.texture = tex

    const { gl, res, texel, rt1, rt2, program, texture, vao } = this

    glu.bindFB(gl, res.x, res.y, rt1.fb)
    glu.blend(gl, null)

    gl.useProgram(program.program)
    gl.bindVertexArray(program.vao)
    glu.uniformTex(gl, program.uniforms.u_texture, texture)
    gl.uniform2f(program.uniforms.u_dir, texel.x, 0)
    glu.draw.quad(gl)

    glu.bindFB(gl, res.x, res.y, rt2.fb)
    glu.uniformTex(gl, program.uniforms.u_texture, rt1.texture)
    gl.uniform2f(program.uniforms.u_dir, 0, texel.y)
    glu.draw.quad(gl)
  }
}
