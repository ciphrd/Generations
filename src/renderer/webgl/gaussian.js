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
    debug: true,
  })

  let loc = program.attributes.a_position
  let vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  gl.enableVertexAttribArray(loc)
  gl.bindBuffer(gl.ARRAY_BUFFER, glu.quadBuffer(gl))
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  initialized[key] = {
    program,
    vao,
  }

  return initialized[key]
}

export class GaussianPass {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl, res, texture, width) {
    this.gl = gl
    this.res = res
    this.texture = texture
    this.rt1 = glu.renderTarget(gl, res.x, res.y)
    this.rt2 = glu.renderTarget(gl, res.x, res.y)
    this.texel = this.res.clone().apply((comp) => 1 / comp)

    const cached = initProgram(gl, width)
    this.program = cached.program
    this.vao = cached.vao

    this.output = this.rt2.texture
  }

  render() {
    const { gl, res, rt1, rt2, program, texture, vao } = this

    glu.bindFB(gl, res.x, res.y, rt1.fb)
    glu.blend(gl, null)

    gl.useProgram(program.program)
    gl.bindVertexArray(vao)
    glu.uniformTex(gl, program.uniforms.u_texture, texture)
    gl.uniform2f(program.uniforms.u_dir, this.texel.x, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    glu.bindFB(gl, res.x, res.y, rt2.fb)
    glu.uniformTex(gl, program.uniforms.u_texture, rt1.texture)
    gl.uniform2f(program.uniforms.u_dir, 0, this.texel.y)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
}
