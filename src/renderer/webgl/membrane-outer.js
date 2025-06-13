import { glu } from "../../utils/glu"
import { GaussianPass } from "./gaussian"
import fullVS from "./shaders/full.vert.glsl"
import postBlurFS from "./shaders/membrane-outer/post-blur.frag.glsl"
import { TrailPass } from "./trail"

export class MembraneOuter {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl, res, fieldRT) {
    const res2 = res.clone().div(2)
    const res4 = res2.clone().div(2)

    this.gl = gl
    this.res = res
    this.res2 = res2
    this.res4 = res4
    this.colorField = fieldRT

    this.smooth = new TrailPass(gl, res, 0.2)

    this.blur1 = new GaussianPass(gl, res2, this.smooth.output, 7)

    this.programs = {
      postBlur: glu.program(gl, fullVS, postBlurFS, {
        attributes: ["a_position"],
        uniforms: ["u_blurred"],
        vao: (prg) => (u) => {
          u.attrib(prg.attributes.a_position, glu.quad(gl), 2)
        },
      }),
    }

    this.rts = {
      postBlur: glu.renderTarget(gl, res.x, res.y, gl.R32F),
    }

    this.output = this.rts.postBlur.tex
  }

  render() {
    const { gl, programs, rts, res, res2 } = this

    this.smooth.render(this.colorField)
    this.blur1.render()

    glu.bindFB(gl, res.x, res.y, rts.postBlur.fb)
    programs.postBlur.use()
    glu.uniformTex(gl, programs.postBlur.uniforms.u_blurred, this.blur1.output)
    glu.draw.quad(gl)
  }
}
