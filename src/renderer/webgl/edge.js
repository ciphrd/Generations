import { glu } from "../../utils/glu"
import fullVS from "./shaders/full.vert.glsl"
import edgeFS from "./shaders/edge.frag.glsl"

let initialized
function initProgram(gl) {
  if (initialized) return initialized

  const program = glu.program(gl, fullVS, edgeFS, {
    attributes: ["a_position"],
    uniforms: ["u_texture", "u_texel_size"],
  })

  let loc = program.attributes.a_position
  let vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  gl.enableVertexAttribArray(loc)
  gl.bindBuffer(gl.ARRAY_BUFFER, glu.quadBuffer(gl))
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  initialized = {
    program,
    vao,
  }

  return initialized
}

export class EdgePass {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(
    gl,
    res,
    texture,
    { format = gl.RGBA32F } = { format: gl.RGBA32F }
  ) {
    this.gl = gl
    this.res = res
    this.texture = texture
    this.rt = glu.renderTarget(gl, res.x, res.y, format, {
      sampling: gl.LINEAR,
    })
    this.output = this.rt.texture
    this.texel = this.res.clone().inv()

    const cached = initProgram(gl)
    this.program = cached.program
    this.vao = cached.vao
  }

  render(tex) {
    if (tex) this.texture = tex

    const { gl, res, rt, program, texture, vao } = this

    glu.bindFB(gl, res.x, res.y, rt.fb)
    glu.blend(gl, null)

    gl.useProgram(program.program)
    gl.bindVertexArray(vao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1i(program.uniforms.u_texture, 0)
    gl.uniform2f(program.uniforms.u_texel_size, this.texel.x, this.texel.y)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
}
