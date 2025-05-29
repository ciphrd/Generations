import { arr } from "../../utils/array"
import { glu } from "../../utils/glu"
import fullVS from "./shaders/full.vert.glsl"
import sharpenFS from "./shaders/sharpen.frag.glsl"

export class SharpenPass {
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
    this.rt = glu.renderTarget(gl, res.x, res.y, format)
    this.output = this.rt.texture
    this.texel = this.res.clone().inv()

    this.program = glu.program(gl, fullVS, sharpenFS, {
      attributes: ["a_position"],
      uniforms: ["u_texture", "u_texel_size"],
    })
    this.vao = glu.vao(gl, (u) => {
      u.attrib(this.program.attributes.a_position, glu.quad(gl), 2)
    })
  }

  render(tex) {
    if (tex) this.texture = tex

    const { gl, res, rt, program, texture, vao } = this

    glu.bindFB(gl, res.x, res.y, rt.fb)
    glu.blend(gl, null)

    gl.useProgram(program.program)
    gl.bindVertexArray(vao)
    glu.uniformTex(gl, program.uniforms.u_texture, texture)
    gl.uniform2f(program.uniforms.u_texel_size, this.texel.x, this.texel.y)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
}
