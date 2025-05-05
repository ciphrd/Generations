import { glu } from "../../utils/glu"
import pointsVS from "./shaders/points.vert.glsl"

export class PointsRenderer {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl, fragment, getPoints) {
    let loc

    this.gl = gl
    this.getPoints = getPoints
    this.points = getPoints()
    this.program = glu.program(gl, pointsVS, fragment, {
      attributes: ["a_position", "a_geometry"],
    })

    const geometry = new Float32Array(this.points.length * 3)
    this.geometryBuffer = glu.dynamicBuffer(gl, geometry, () => {
      for (let i = 0, body; i < this.points.length; i++) {
        body = this.points[i]
        geometry[i * 3 + 0] = body.pos.x
        geometry[i * 3 + 1] = body.pos.y
        geometry[i * 3 + 2] = body.radius
      }
      return geometry
    })

    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)

    loc = this.program.attributes.a_position
    gl.bindBuffer(gl.ARRAY_BUFFER, glu.quadBuffer(gl))
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    loc = this.program.attributes.a_geometry
    gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryBuffer.buffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(loc, 1)
  }

  render() {
    const { gl, program } = this

    this.geometryBuffer.update()

    gl.useProgram(program.program)
    gl.bindVertexArray(this.vao)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.points.length)
  }

  update() {
    this.points = this.getPoints()
  }
}
