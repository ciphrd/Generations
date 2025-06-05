import { glu } from "../../utils/glu"
import fullVS from "./shaders/full.vert.glsl"
import trailFS from "./shaders/trail.frag.glsl"

export class TrailPass {
  constructor(
    gl,
    res,
    strength,
    { format = gl.RGBA32F, sampling = gl.NEAREST } = {
      format: gl.RGBA32F,
      sampling: gl.NEAREST,
    }
  ) {
    this.gl = gl
    this.res = res
    this.strength = strength

    this.pp = glu.pingpong(gl, res.x, res.y, format, { sampling })
    this.program = glu.program(gl, fullVS, trailFS, {
      attributes: ["a_position"],
      uniforms: ["u_frame_prev", "u_frame_new", "u_strength"],
      vao: (prg) => (u) => {
        u.attrib(prg.attributes.a_position, glu.quad(gl), 2)
      },
    })

    this.output = this.pp.back().tex
  }

  render(texture) {
    const { gl, res, pp, program, strength } = this

    pp.swap()
    glu.bindFB(gl, res.x, res.y, pp.back().fb)
    program.use()
    glu.uniformTex(gl, program.uniforms.u_frame_prev, pp.front().tex, 0)
    glu.uniformTex(gl, program.uniforms.u_frame_new, texture, 1)
    gl.uniform1f(program.uniforms.u_strength, strength)
    glu.draw.quad(gl)

    this.output = this.pp.back().tex
  }
}
