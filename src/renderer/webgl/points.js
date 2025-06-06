import { glu } from "../../utils/glu"
import pointsVS from "./shaders/points.vert.glsl"
import { viewUniform } from "./view"

export class PointsRenderer {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl, fragment, getPoints) {
    let loc

    this.gl = gl
    this.getPoints = getPoints
    this.points = getPoints()

    const geometry = new Float32Array(this.points.length * 4)
    this.geometryBuffer = glu.dynamicBuffer(gl, geometry, () => {
      for (let i = 0, body; i < this.points.length; i++) {
        body = this.points[i]
        geometry[i * 4 + 0] = body.id + body.pos.x
        geometry[i * 4 + 1] = body.pos.y
        geometry[i * 4 + 2] = body.radius
        geometry[i * 4 + 3] = body.initial.radius
      }
      return geometry
    })

    this.program = glu.program(gl, pointsVS, fragment, {
      attributes: ["a_position", "a_properties", "a_geometry"],
      uniforms: ["u_view"],
      vao: (prg) => (u) => {
        u.attrib(prg.attributes.a_position, glu.quad(gl), 2)
        u.attrib(
          prg.attributes.a_geometry,
          this.geometryBuffer.buffer,
          4,
          gl.FLOAT,
          true
        )
      },
    })
  }

  render(worldSpace = false) {
    const { gl, program } = this

    this.geometryBuffer.update()

    program.use()
    viewUniform(gl, program, worldSpace)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.points.length)
  }

  update() {
    this.points = this.getPoints()
  }
}
