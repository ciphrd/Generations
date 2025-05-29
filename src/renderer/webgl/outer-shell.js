import { glu } from "../../utils/glu"
import { EdgePass } from "./edge"
import { GaussianPass } from "./gaussian"
import fullVS from "./shaders/full.vert.glsl"
import preBlurFS from "./shaders/membrane/outer-shell-pre-blur.frag.glsl"
import { SharpenPass } from "./sharpen"

/**
 * The Outer Shell is similar to the membrane but provides a gradient towards
 * the center of the cell, which depends on the membrane width.
 */
export class OuterShell {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl, res, membrane, cellNoise) {
    this.gl = gl
    this.res = res
    this.res2 = res.clone().div(2)
    this.texel = this.res.clone().inv()
    this.membrane = membrane
    this.cellNoise = cellNoise

    this.rt = glu.renderTarget(gl, res.x, res.y, gl.R32F, {
      sampling: gl.LINEAR,
      wrap: gl.CLAMP_TO_EDGE,
    })

    this.blurMembranePass = new GaussianPass(gl, this.res2, this.rt.tex, 21, {
      format: gl.R32F,
      wrap: gl.CLAMP_TO_EDGE,
    })

    this.programs = {
      preBlur: glu.program(gl, fullVS, preBlurFS, {
        attributes: ["a_position"],
        uniforms: ["u_memb", "u_cell_noise"],
        vao: (prg) => (u) => {
          u.attrib(prg.attributes.a_position, glu.quad(gl), 2)
        },
      }),
    }

    this.output = this.blurMembranePass.output
  }

  render() {
    const { gl, res, res2, rt, rt2, programs, blurMembranePass, cellNoise } =
      this
    const { preBlur, postBlur } = programs

    glu.bindFB(gl, res.x, res.y, rt.fb)
    glu.blend(gl, null)
    preBlur.use()
    glu.uniformTex(gl, preBlur.uniforms.u_memb, this.membrane, 0)
    glu.uniformTex(gl, preBlur.uniforms.u_cell_noise, cellNoise, 1)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    blurMembranePass.render()
  }
}
