import { glu } from "../../utils/glu"
import { EdgePass } from "./edge"
import { GaussianPass } from "./gaussian"
import fullVS from "./shaders/full.vert.glsl"
import edgeMembraneFS from "./shaders/membrane/edge-membrane.frag.glsl"
import postBlurFS from "./shaders/membrane/post-blur.frag.glsl"
import { SharpenPass } from "./sharpen"

export class MembranePass {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl, res, colorField, cellNoiseField) {
    res = res.clone().mul(2)
    this.gl = gl
    this.res = res
    this.colorField = colorField
    this.cellNoiseField = cellNoiseField

    this.blurFieldPass = new GaussianPass(gl, res, cellNoiseField, 5, {
      format: gl.R32F,
    })
    this.edgePass1 = new EdgePass(gl, res, colorField)

    this.rt = glu.renderTarget(gl, res.x, res.y, gl.R32F)
    this.texel = this.res.clone().apply((comp) => 1 / comp)

    this.programs = {}
    this.vaos = {}

    this.programs.postEdge = glu.program(gl, fullVS, edgeMembraneFS, {
      attributes: ["a_position"],
      uniforms: ["u_memb_edge", "u_cell_noise"],
    })
    this.vaos.postEdge = glu.vao(gl, (u) => {
      u.attrib(this.programs.postEdge.attributes.a_position, glu.quad(gl), 2)
    })

    this.gaussian1 = new GaussianPass(gl, res, this.rt.texture, 13, {
      format: gl.R32F,
    })

    this.postBlurRt = glu.renderTarget(gl, res.x, res.y, gl.R32F)
    this.programs.postBlur = glu.program(gl, fullVS, postBlurFS, {
      attributes: ["a_position"],
      uniforms: ["u_texture"],
    })
    this.vaos.postBlur = glu.vao(gl, (u) => {
      u.attrib(this.programs.postBlur.attributes.a_position, glu.quad(gl), 2)
    })

    this.sharpen = new SharpenPass(gl, res, this.postBlurRt.texture, {
      format: gl.R32F,
    })

    this.output = this.sharpen.output
  }

  render() {
    const { gl, res, rt, programs, vaos, colorField, cellNoiseField } = this
    const { postEdge, postBlur } = programs

    this.blurFieldPass.render()
    this.edgePass1.render()

    glu.bindFB(gl, res.x, res.y, rt.fb)
    glu.blend(gl, null)

    gl.useProgram(postEdge.program)
    gl.bindVertexArray(vaos.postEdge)
    glu.uniformTex(gl, postEdge.uniforms.u_memb_edge, this.edgePass1.output)
    glu.uniformTex(
      gl,
      postEdge.uniforms.u_cell_noise,
      this.blurFieldPass.output,
      1
    )
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    this.gaussian1.render()

    glu.bindFB(gl, res.x, res.y, this.postBlurRt.fb)
    gl.useProgram(postBlur.program)
    gl.bindVertexArray(vaos.postBlur)
    glu.uniformTex(gl, postBlur.uniforms.u_texture, this.gaussian1.output)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    this.sharpen.render()
  }
}
