import { glu } from "../../utils/glu"
import { GaussianPass } from "./gaussian"
import fullVS from "./shaders/full.vert.glsl"
import edgeMembraneFS from "./shaders/membrane/edge-membrane.frag.glsl"

let initialized
function initProgram(gl) {
  if (initialized) return initialized

  const program = glu.program(gl, fullVS, edgeMembraneFS, {
    attributes: ["a_position"],
    uniforms: ["u_memb_edge", "u_cell_noise"],
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

export class MembranePass {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl, res, colorField, cellNoiseField) {
    this.gl = gl
    this.res = res
    this.colorField = colorField
    this.cellNoiseField = cellNoiseField
    this.rt = glu.renderTarget(gl, res.x, res.y, gl.R32F, {
      sampling: gl.LINEAR,
    })
    this.texel = this.res.clone().apply((comp) => 1 / comp)

    const cached = initProgram(gl)
    this.program = cached.program
    this.vao = cached.vao

    this.gaussian1 = new GaussianPass(gl, res, this.rt.texture, 7)

    this.output = this.gaussian1.output
  }

  render() {
    const { gl, res, rt, program, colorField, cellNoiseField, vao } = this

    glu.bindFB(gl, res.x, res.y, rt.fb)
    glu.blend(gl, null)

    gl.useProgram(program.program)
    gl.bindVertexArray(vao)
    glu.uniformTex(gl, program.uniforms.u_memb_edge, colorField)
    glu.uniformTex(gl, program.uniforms.u_cell_noise, cellNoiseField, 1)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    this.gaussian1.render()
  }
}
