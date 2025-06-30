import { glu } from "../../utils/glu"
import fullVS from "./shaders/full.vert.glsl"
import compFS from "./shaders/composition/composition.frag.glsl"
import convolveFS from "./shaders/convolve.frag.glsl"
import { settings } from "../../settings"
import { Params } from "../../parametric-space"

/**
 * Simulates the microscopy vision, by using the absorption map.
 */
export class CompositionPass {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl, getInputs) {
    this.gl = gl
    this.getInputs = getInputs

    this.programs = {
      emboss: glu.program(gl, fullVS, convolveFS, {
        attributes: ["a_position"],
        uniforms: ["u_tex", "u_texel_size"],
        variables: {
          KERNEL: "1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0",
        },
        vao: (prg) => (u) => {
          u.quad(prg)
        },
      }),
      composition: glu.program(gl, fullVS, compFS, {
        attributes: ["a_position"],
        uniforms: ["u_absorption", "u_emboss", "u_backlight_color"],
        vao: (prg) => (u) => {
          u.quad(prg)
        },
        variables: {
          SOBEL_STRENGTH: Params.sobelStrength.toFixed(3),
        },
      }),
    }

    this.#allocate()
  }

  #allocate() {
    const { gl, getInputs } = this
    const { res, absorb } = getInputs()

    glu.free(gl, this.rts)

    this.res = res
    this.res2 = res.clone().div(2)
    this.texel = res.clone().inv()
    this.absorpTex = absorb

    this.rts = {
      emboss: glu.renderTarget(gl, this.res2.x, this.res2.y, gl.R32F),
      comp: glu.renderTarget(gl, res.x, res.y),
    }
  }

  onResize() {
    this.#allocate()
  }

  render() {
    const { gl, res, res2, texel, rts, programs, absorpTex } = this

    glu.blend(gl, null)

    glu.bindFB(gl, res2.x, res2.y, rts.emboss.fb)
    programs.emboss.use()
    glu.uniformTex(gl, programs.emboss.uniforms.u_tex, absorpTex)
    gl.uniform2f(programs.emboss.uniforms.u_texel_size, texel.x, texel.y)
    glu.draw.quad(gl)

    glu.bindFB(gl, res.x, res.y, null)
    programs.composition.use()
    glu.uniformTex(gl, programs.composition.uniforms.u_absorption, absorpTex, 0)
    glu.uniformTex(
      gl,
      programs.composition.uniforms.u_emboss,
      rts.emboss.tex,
      1
    )
    gl.uniform3fv(
      programs.composition.uniforms.u_backlight_color,
      settings.microscopy.light.backlightColor.rgb
    )
    glu.draw.quad(gl)
  }
}
