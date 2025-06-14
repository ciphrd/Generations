import { Controls } from "../../controls"
import { glu } from "../../utils/glu"
import fullVS from "./shaders/full.vert.glsl"
import viewFS from "./shaders/view.frag.glsl"

export function viewUniform(gl, progObject, worldSpace = false) {
  if (worldSpace) {
    gl.uniform4f(progObject.uniforms.u_view, 0, 0, 1, 1)
  } else {
    gl.uniform4fv(progObject.uniforms.u_view, Controls.getTxMatrix())
  }
}

export class ViewPass {
  constructor(gl, getInputs) {
    this.gl = gl
    this.getInputs = getInputs

    this.program = glu.program(gl, fullVS, viewFS, {
      attributes: ["a_position"],
      uniforms: ["u_tex", "u_view"],
      vao: (prg) => (u) => {
        u.quad(prg)
      },
    })

    this.#allocate()
  }

  #allocate() {
    const { gl, getInputs } = this
    const { res, tex } = getInputs()

    this.res = res
    this.tex = tex
    this.rt = glu.renderTarget(gl, res.x, res.y)
    this.output = this.rt.tex
  }

  onResize() {
    this.#allocate()
  }

  render(texture = null) {
    if (texture) this.tex = texture

    const { gl, res, rt, tex, program } = this

    glu.bindFB(gl, res.x, res.y, rt.fb)
    program.use()
    viewUniform(gl, program)
    glu.uniformTex(gl, program.uniforms.u_tex, tex)
    glu.draw.quad(gl)
  }
}
