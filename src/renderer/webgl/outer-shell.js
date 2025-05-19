import { glu } from "../../utils/glu"
import { EdgePass } from "./edge"
import { GaussianPass } from "./gaussian"
import fullVS from "./shaders/full.vert.glsl"
import edgeMembraneFS from "./shaders/membrane/edge-membrane.frag.glsl"
import postBlurFS from "./shaders/membrane/post-blur.frag.glsl"
import { SharpenPass } from "./sharpen"

/**
 * The Outer Shell is similar to the membrane but provides a gradient towards
 * the center of the cell, which depends on the membrane width.
 */
export class OuterShell {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl, res, colorField, cellNoiseField) {
    this.gl = gl
    this.res = res
    this.colorField = colorField
    this.cellNoiseField = cellNoiseField

    this.edgePass1 = new EdgePass(gl, res.clone().div(2), colorField)

    this.rt = glu.renderTarget(gl, res.x, res.y, gl.R32F, {
      sampling: gl.LINEAR,
      wrap: gl.CLAMP_TO_EDGE,
    })
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

    this.gaussian1 = new GaussianPass(
      gl,
      res.clone().div(2),
      this.rt.texture,
      19
    )

    this.output = this.gaussian1.output
  }

  render() {
    const { gl, res, rt, programs, vaos, colorField, cellNoiseField } = this
    const { postEdge, postBlur } = programs

    this.edgePass1.render()

    glu.bindFB(gl, res.x, res.y, rt.fb)
    glu.blend(gl, null)

    gl.useProgram(postEdge.program)
    gl.bindVertexArray(vaos.postEdge)
    glu.uniformTex(gl, postEdge.uniforms.u_memb_edge, this.edgePass1.output)
    glu.uniformTex(gl, postEdge.uniforms.u_cell_noise, this.cellNoiseField, 1)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    this.gaussian1.render()
  }
}
