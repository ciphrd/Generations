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
  constructor(gl, res, fieldRT) {
    this.gl = gl
    this.res = res
    this.colorField = fieldRT.textures[0]
    this.cellNoiseField = fieldRT.textures[1]

    this.rt = glu.renderTarget(gl, res.x, res.y, gl.R32F)
    this.postBlurRt = glu.renderTarget(gl, res.x, res.y, gl.R32F)
    this.texel = this.res.clone().inv()

    this.programs = {
      postEdge: glu.program(gl, fullVS, edgeMembraneFS, {
        attributes: ["a_position"],
        uniforms: ["u_memb_edge", "u_cell_noise"],
        vao: (prg) => (u) => {
          u.attrib(prg.attributes.a_position, glu.quad(gl), 2)
        },
      }),
      postBlur: glu.program(gl, fullVS, postBlurFS, {
        attributes: ["a_position"],
        uniforms: ["u_texture"],
        vao: (prg) => (u) => {
          u.attrib(prg.attributes.a_position, glu.quad(gl), 2)
        },
      }),
    }

    this.blurFieldPass = new GaussianPass(
      gl,
      () => ({ res, tex: this.cellNoiseField }),
      13,
      {
        format: gl.R32F,
      }
    )
    this.edgePass = new EdgePass(gl, res, this.colorField)
    this.blurEdgePass = new GaussianPass(
      gl,
      () => ({ res, tex: this.rt.texture }),
      9,
      {
        format: gl.R32F,
      }
    )

    this.output = this.postBlurRt.tex
  }

  render() {
    const { gl, res, rt, programs, vaos, colorField, cellNoiseField } = this
    const { postEdge, postBlur } = programs

    this.blurFieldPass.render()
    this.edgePass.render()

    glu.bindFB(gl, res.x, res.y, rt.fb)
    glu.blend(gl, null)

    postEdge.use()
    glu.uniformTex(gl, postEdge.uniforms.u_memb_edge, this.edgePass.output)
    glu.uniformTex(
      gl,
      postEdge.uniforms.u_cell_noise,
      this.blurFieldPass.output,
      1
    )
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    this.blurEdgePass.render()

    glu.bindFB(gl, res.x, res.y, this.postBlurRt.fb)
    postBlur.use()
    glu.uniformTex(gl, postBlur.uniforms.u_texture, this.blurEdgePass.output)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
}
